"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { AlertCircle, Check, LocateFixed, MapPin, Minus, Phone, Plus, WifiOff, X } from "lucide-react"
import { Option, Spot } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { Address } from "@/lib/auth"
import { currentPosition, type LatLng, type Where } from "@/lib/map"
import { plainToHtml, toPlainText } from "@/lib/rich-text"
import { CategoryIcon } from "@/components/ui/category-icon"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useDialog } from "@/lib/use-dialog"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-60 rounded-2xl bg-gray-100 animate-pulse" />,
})

export type PostTypeSelection = "recomiendo" | "necesito" | "ofrezco" | "emergencia"
export type EmergencyKindValue = "NEED" | "OFFER"

export interface NewPostData {
  type: PostTypeSelection
  category: string
  categoryLabel: string
  description: string
  details: string
  reference: string
  phone: string
  emergencyKind: EmergencyKindValue
  peopleCount: number
  vulnerable: string[]
  where: Where | null
  tags: string[]
  comment: string
  opensAt: string
  closesAt: string
  openDays: string
}

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: PostTypeSelection
  initialEmergencyKind?: EmergencyKindValue
  initialText?: string
  addresses: Address[]
  home: LatLng
  mapStyleUrl: string | null
  categories: Record<PostTypeSelection, Option[]>
  emergencyKinds: Option[]
  emergencyNumbers: Option[]
  vulnerableGroups: Option[]
  recommendationTags: Option[]
  openDayOptions: Option[]
  onSubmitPost: (data: NewPostData) => Promise<PublishResult>
}

export interface PublishResult {
  message: string
  queued?: boolean
}

const TYPES: { value: PostTypeSelection; title: string; hint: string; active: string; idle: string; titleColor: string }[] = [
  { value: "recomiendo", title: "Recomiendo", hint: "Un negocio o servicio", active: "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30", idle: "border-gray-200", titleColor: "text-[#172B2A]" },
  { value: "necesito", title: "Necesito", hint: "Pide un favor", active: "border-[#D97706] bg-[#FFF8E6] ring-2 ring-[#D97706]/30", idle: "border-gray-200", titleColor: "text-[#8A5800]" },
  { value: "ofrezco", title: "Ofrezco", hint: "Presta o regala algo", active: "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30", idle: "border-gray-200", titleColor: "text-[#087F72]" },
  { value: "emergencia", title: "Emergencia", hint: "Alguien necesita ayuda ya", active: "border-rose-500 bg-rose-50 ring-2 ring-rose-500/30", idle: "border-rose-200/80", titleColor: "text-[#BA1A1A]" },
]

const DETAILS_MAX = 1500
const COMMENT_MAX = 1000
const FIRE_NUMBER = "116"

const isRichType = (type: PostTypeSelection) => type === "necesito" || type === "ofrezco"

const PLACEHOLDERS: Record<
  PostTypeSelection,
  { label: string; placeholder: string; required: boolean; maxLength: number; reference: string }
> = {
  recomiendo: { label: "Nombre del negocio", placeholder: "Ej: Gasfitería Don Lucho", required: true, maxLength: 120, reference: "Ej: Cerca al parque principal" },
  necesito: { label: "Cuéntalo con detalle", placeholder: "Ej: Una escalera por 2 horas", required: false, maxLength: DETAILS_MAX, reference: "Ej: Cerca al parque principal" },
  ofrezco: { label: "Cuéntalo con detalle", placeholder: "Ej: Presto mi taladro los fines de semana", required: false, maxLength: DETAILS_MAX, reference: "Ej: Cerca al parque principal" },
  emergencia: { label: "¿Qué está pasando?", placeholder: "Ej: Adulto mayor sin agua", required: false, maxLength: 100, reference: "Ej: Casa azul frente a la iglesia" },
}

const chipClass = (active: boolean) =>
  `px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
    active ? "bg-[#087F72] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
  }`

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  initialType = "necesito",
  initialEmergencyKind = "NEED",
  initialText = "",
  addresses,
  home,
  mapStyleUrl,
  categories,
  emergencyKinds,
  emergencyNumbers,
  vulnerableGroups,
  recommendationTags,
  openDayOptions,
  onSubmitPost,
}) => {
  const [selectedType, setSelectedType] = useState<PostTypeSelection>(initialType)
  const [emergencyKind, setEmergencyKind] = useState<EmergencyKindValue>(initialEmergencyKind)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState(isRichType(initialType) ? "" : initialText)
  const [details, setDetails] = useState(isRichType(initialType) ? plainToHtml(initialText) : "")
  const [reference, setReference] = useState("")
  const [phone, setPhone] = useState("")
  const [peopleCount, setPeopleCount] = useState(1)
  const [vulnerable, setVulnerable] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [submitError, setSubmitError] = useState("")
  const [whereKey, setWhereKey] = useState(initialType === "emergencia" ? "gps" : "")
  const [gpsPoint, setGpsPoint] = useState<LatLng | null>(null)
  const [gpsState, setGpsState] = useState<"idle" | "locating" | "error">(initialType === "emergencia" ? "locating" : "idle")
  const [gpsNote, setGpsNote] = useState("")
  const [pickedSpot, setPickedSpot] = useState<Spot | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [opensAt, setOpensAt] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [openDays, setOpenDays] = useState("")

  const dialogRef = useRef<HTMLDivElement>(null)
  useDialog(isOpen, dialogRef, onClose)

  const hasAddress = addresses.length > 0
  const locate = useCallback(
    (fallbackToHome: boolean) => {
      setWhereKey("gps")
      setGpsState("locating")
      setGpsNote("")
      currentPosition()
        .then(point => {
          setGpsPoint(point)
          setGpsState("idle")
        })
        .catch(() => {
          if (fallbackToHome && hasAddress) {
            setWhereKey("")
            setGpsState("idle")
            setGpsNote("No pudimos saber dónde estás, así que usamos tu dirección principal. Cámbiala si estás en otro lugar.")
          } else {
            setGpsState("error")
          }
        })
    },
    [hasAddress]
  )

  useEffect(() => {
    if (!isOpen || initialType !== "emergencia") return
    const timer = window.setTimeout(() => locate(true), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, initialType, locate])

  if (!isOpen) return null

  const options = categories[selectedType] ?? []
  const currentCategory = options.some(o => o.value === category)
    ? category
    : options.length === 1
      ? options[0].value
      : ""
  const text = PLACEHOLDERS[selectedType]
  const fireNumber = emergencyNumbers.find(n => n.value === FIRE_NUMBER)

  const primary = addresses.find(a => a.primary) ?? addresses[0]
  const currentWhere = whereKey || (primary ? `a-${primary.id}` : "")
  const whereTitle =
    selectedType === "recomiendo" ? "¿Dónde queda?" : selectedType === "emergencia" ? "¿Dónde es?" : "¿Dónde?"

  const chooseGps = () => locate(false)

  const resolveWhere = (): Where | null | "missing" => {
    if (currentWhere.startsWith("a-")) return { addressId: Number(currentWhere.slice(2)) }
    if (currentWhere === "gps") return gpsPoint ? { latitude: gpsPoint.lat, longitude: gpsPoint.lng } : "missing"
    if (currentWhere === "map") return pickedSpot ? { latitude: pickedSpot.latitude, longitude: pickedSpot.longitude } : "missing"
    return null
  }

  const handleTypeSelect = (type: PostTypeSelection) => {
    if (isRichType(type) && !isRichType(selectedType) && !details && description.trim()) {
      setDetails(plainToHtml(description))
    }
    if (!isRichType(type) && isRichType(selectedType) && !description.trim() && details) {
      const first = toPlainText(details).split("\n")[0].trim()
      setDescription(first.slice(0, PLACEHOLDERS[type].maxLength))
    }
    setSelectedType(type)
    setCategory("")
    setSubmitError("")
    if (type === "emergencia" && !whereKey && !gpsNote) locate(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    if (!currentCategory) {
      setSubmitError(
        selectedType === "emergencia" ? "Elige qué tipo de ayuda se necesita." : "Elige una categoría para tu publicación."
      )
      return
    }
    if (text.required && !description.trim()) {
      setSubmitError("Escribe el nombre del negocio que recomiendas.")
      return
    }
    if (selectedType === "recomiendo" && Boolean(opensAt) !== Boolean(closesAt)) {
      setSubmitError("Indica a qué hora abre y a qué hora cierra, o deja ambos vacíos.")
      return
    }
    const where = resolveWhere()
    if (where === "missing") {
      setSubmitError(
        currentWhere === "gps"
          ? "Todavía no tenemos tu ubicación. Espera un momento o elige una de tus direcciones."
          : "Mueve el mapa hasta que el pin quede sobre el lugar."
      )
      return
    }
    setIsSubmitting(true)
    try {
      const outcome = await onSubmitPost({
        type: selectedType,
        category: currentCategory,
        categoryLabel: options.find(o => o.value === currentCategory)?.label ?? "",
        description: description.trim(),
        details: isRichType(selectedType) ? details : "",
        reference: reference.trim(),
        phone: phone.replace(/\D/g, ""),
        emergencyKind,
        peopleCount,
        vulnerable: selectedType === "emergencia" && emergencyKind === "NEED" ? vulnerable : [],
        where,
        tags,
        comment: comment.trim(),
        opensAt,
        closesAt,
        openDays: opensAt ? openDays : "",
      })
      setResult(outcome)
      setDescription("")
      setDetails("")
      setReference("")
      setPhone("")
      setPeopleCount(1)
      setVulnerable([])
      setTags([])
      setComment("")
      setOpensAt("")
      setClosesAt("")
      setOpenDays("")
      setTimeout(() => {
        setResult(null)
        onClose()
      }, outcome.queued ? 4000 : 2200)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.friendlyMessage : "No pudimos publicar. Intenta otra vez.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Publicar"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md min-h-screen sm:min-h-0 bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
            aria-label="Cerrar ventana"
          >
            <X className="size-4" />
          </button>
          <span className="text-xs font-bold text-gray-400">Publicar en el barrio</span>
          <div className="size-9" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          <h2 className="text-xl sm:text-2xl font-black text-[#172B2A] tracking-tight">¿Qué quieres publicar?</h2>

          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                aria-pressed={selectedType === t.value}
                onClick={() => handleTypeSelect(t.value)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedType === t.value ? t.active : `${t.idle} bg-white hover:border-gray-300`
                }`}
              >
                <p className={`text-sm font-black ${t.titleColor}`}>{t.title}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">{t.hint}</p>
              </button>
            ))}
          </div>

          {selectedType === "emergencia" && emergencyKinds.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-rose-50">
              {emergencyKinds.map(k => (
                <button
                  key={k.value}
                  type="button"
                  aria-pressed={emergencyKind === k.value}
                  onClick={() => setEmergencyKind(k.value as EmergencyKindValue)}
                  className={`h-10 rounded-xl text-xs font-bold ${
                    emergencyKind === k.value ? "bg-[#BA1A1A] text-white" : "text-[#BA1A1A]"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {selectedType === "emergencia" && emergencyKind === "NEED" && fireNumber && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3" role="note">
              <p className="text-sm font-bold text-[#7F1D1D] leading-snug">
                Si hay peligro para la vida, un incendio o alguien herido de gravedad, llama primero a {fireNumber.label}. Después avisa a tus vecinos.
              </p>
              <a
                href={`tel:${fireNumber.value}`}
                className="h-12 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] text-white text-sm font-black flex items-center justify-center gap-2"
              >
                <Phone className="size-5 shrink-0" />
                Llamar al {fireNumber.value} · {fireNumber.label}
              </a>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700">
              {selectedType === "emergencia" ? "¿Qué tipo de ayuda?" : "Categoría"}
            </p>
            {options.length === 0 && <p className="text-xs text-gray-400">Cargando categorías…</p>}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categoría">
              {options.map(o => (
                <button
                  type="button"
                  key={o.value}
                  aria-pressed={currentCategory === o.value}
                  onClick={() => {
                    setCategory(o.value)
                    setSubmitError("")
                  }}
                  className={chipClass(currentCategory === o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {isRichType(selectedType) ? (
              <>
                <p id="post-text-label" className="text-xs font-bold text-gray-700">
                  {text.label} <span className="font-normal text-gray-400">(opcional)</span>
                </p>
                <RichTextEditor
                  value={details}
                  onChange={setDetails}
                  placeholder={text.placeholder}
                  maxLength={text.maxLength}
                  label={text.label}
                />
                <p className="text-xs text-gray-500">La primera línea será el título de tu publicación.</p>
              </>
            ) : (
              <>
                <label htmlFor="post-text" className="text-xs font-bold text-gray-700">
                  {text.label} {!text.required && <span className="font-normal text-gray-400">(opcional)</span>}
                </label>
                <textarea
                  id="post-text"
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={text.placeholder}
                  maxLength={text.maxLength}
                  className="w-full p-3.5 rounded-2xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 resize-none"
                />
              </>
            )}
          </div>

          {selectedType === "recomiendo" && (
            <div className="space-y-2">
              <label htmlFor="post-phone" className="text-xs font-bold text-gray-700">
                Teléfono del negocio <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="post-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="987 654 321"
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
              />
            </div>
          )}

          {selectedType === "recomiendo" && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-gray-700 mb-2">
                Horario <span className="font-normal text-gray-400">(opcional)</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-gray-500">Abre</span>
                  <input
                    type="time"
                    value={opensAt}
                    onChange={e => setOpensAt(e.target.value)}
                    className="w-full h-11 px-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-gray-500">Cierra</span>
                  <input
                    type="time"
                    value={closesAt}
                    onChange={e => setClosesAt(e.target.value)}
                    className="w-full h-11 px-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
                  />
                </label>
              </div>
              {opensAt && openDayOptions.length > 0 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Días que atiende">
                  {openDayOptions.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={openDays === d.value}
                      onClick={() => setOpenDays(current => (current === d.value ? "" : d.value))}
                      className={chipClass(openDays === d.value)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {selectedType === "recomiendo" && recommendationTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-700">
                ¿Qué destacas? <span className="font-normal text-gray-400">(opcional)</span>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Lo que destacas">
                {recommendationTags.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={tags.includes(t.value)}
                    onClick={() =>
                      setTags(current => (current.includes(t.value) ? current.filter(v => v !== t.value) : [...current, t.value]))
                    }
                    className={chipClass(tags.includes(t.value))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <RichTextEditor
                value={comment}
                onChange={setComment}
                maxLength={COMMENT_MAX}
                label="Tu comentario"
                placeholder="Cuéntale a tus vecinos tu experiencia (opcional)"
                minHeight={80}
              />
            </div>
          )}

          {selectedType === "emergencia" && emergencyKind === "NEED" && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700">¿Cuántas personas necesitan ayuda?</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Menos personas"
                  onClick={() => setPeopleCount(n => Math.max(1, n - 1))}
                  className="size-9 rounded-full border border-gray-300 flex items-center justify-center"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-base font-black">{peopleCount}</span>
                <button
                  type="button"
                  aria-label="Más personas"
                  onClick={() => setPeopleCount(n => Math.min(50, n + 1))}
                  className="size-9 rounded-full border border-gray-300 flex items-center justify-center"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          {selectedType === "emergencia" && emergencyKind === "NEED" && vulnerableGroups.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-700">
                ¿Hay alguien que necesite más cuidado? <span className="font-normal text-gray-400">(opcional)</span>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Personas vulnerables">
                {vulnerableGroups.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    aria-pressed={vulnerable.includes(g.value)}
                    onClick={() =>
                      setVulnerable(current =>
                        current.includes(g.value) ? current.filter(v => v !== g.value) : [...current, g.value]
                      )
                    }
                    className={chipClass(vulnerable.includes(g.value))}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#087F72]" />
              {whereTitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {addresses.map(a => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={currentWhere === `a-${a.id}`}
                  onClick={() => {
                    setWhereKey(`a-${a.id}`)
                    setGpsNote("")
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                    currentWhere === `a-${a.id}`
                      ? "bg-[#087F72] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <CategoryIcon name={a.icon} className="size-3.5" />
                  {a.label}
                  <span className={currentWhere === `a-${a.id}` ? "text-white/80 font-medium" : "text-gray-400 font-medium"}>
                    · {a.neighborhood}
                  </span>
                </button>
              ))}
              <button
                type="button"
                aria-pressed={currentWhere === "gps"}
                onClick={chooseGps}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentWhere === "gps"
                    ? "bg-[#087F72] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <LocateFixed className="size-3.5" />
                Donde estoy ahora
              </button>
              {mapStyleUrl && (
                <button
                  type="button"
                  aria-pressed={currentWhere === "map"}
                  onClick={() => setWhereKey("map")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                    currentWhere === "map"
                      ? "bg-[#087F72] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <MapPin className="size-3.5" />
                  Otro lugar
                </button>
              )}
            </div>
            {currentWhere === "gps" && (
              <p className={`text-xs ${gpsState === "error" ? "font-semibold text-rose-600" : "text-gray-500"}`}>
                {gpsState === "locating"
                  ? "Buscando dónde estás…"
                  : gpsState === "error"
                    ? "No pudimos obtener tu ubicación. Elige una de tus direcciones u «Otro lugar»."
                    : "Usaremos el lugar donde estás ahora."}
              </p>
            )}
            {gpsNote && currentWhere !== "gps" && <p className="text-xs font-semibold text-amber-800">{gpsNote}</p>}
            {currentWhere === "map" && mapStyleUrl && (
              <LocationPicker styleUrl={mapStyleUrl} start={home} startZoom={15} confirmed onChange={setPickedSpot} />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="post-reference" className="text-xs font-bold text-gray-700">
              Referencia <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="post-reference"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={text.reference}
              maxLength={selectedType === "emergencia" ? 45 : 200}
              className="w-full h-11 px-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
            />
          </div>

          <div className="pt-2 space-y-2">
            {submitError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            {result && (
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-xs font-semibold border ${
                  result.queued
                    ? "bg-amber-50 text-amber-900 border-amber-300"
                    : "bg-[#EAF5F1] text-[#087F72] border-[#087F72]/30"
                }`}
                role="status"
              >
                {result.queued ? <WifiOff className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
                <span>{result.message}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !!result || options.length === 0}
              className={`w-full h-12 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60 ${
                selectedType === "emergencia" ? "bg-[#BA1A1A] hover:bg-[#9B1414]" : "bg-[#087F72] hover:bg-[#075E54]"
              }`}
            >
              {result ? (
                <>
                  <Check className="size-5" />
                  {result.queued ? "Guardado" : "Listo"}
                </>
              ) : isSubmitting ? (
                "Publicando…"
              ) : selectedType === "emergencia" ? (
                "Enviar alerta"
              ) : (
                "Publicar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
