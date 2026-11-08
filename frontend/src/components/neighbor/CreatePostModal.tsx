"use client"

import React, { useEffect, useState } from "react"
import { AlertCircle, Check, MapPin, Minus, Plus, X } from "lucide-react"
import { Option } from "@/lib/types"
import { ApiError } from "@/lib/api"

export type PostTypeSelection = "recomiendo" | "necesito" | "ofrezco" | "emergencia"
export type EmergencyKindValue = "NEED" | "OFFER"

export interface NewPostData {
  type: PostTypeSelection
  category: string
  categoryLabel: string
  description: string
  reference: string
  phone: string
  emergencyKind: EmergencyKindValue
  peopleCount: number
}

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: PostTypeSelection
  initialEmergencyKind?: EmergencyKindValue
  userNeighborhood: string
  categories: Record<PostTypeSelection, Option[]>
  emergencyKinds: Option[]
  onSubmitPost: (data: NewPostData) => Promise<string>
}

const TYPES: { value: PostTypeSelection; title: string; hint: string; active: string; idle: string; titleColor: string }[] = [
  { value: "recomiendo", title: "Recomiendo", hint: "Un negocio o servicio", active: "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30", idle: "border-gray-200", titleColor: "text-[#172B2A]" },
  { value: "necesito", title: "Necesito", hint: "Pide un favor", active: "border-[#D97706] bg-[#FFF8E6] ring-2 ring-[#D97706]/30", idle: "border-gray-200", titleColor: "text-[#8A5800]" },
  { value: "ofrezco", title: "Ofrezco", hint: "Presta o regala algo", active: "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30", idle: "border-gray-200", titleColor: "text-[#087F72]" },
  { value: "emergencia", title: "Emergencia", hint: "Alguien necesita ayuda ya", active: "border-rose-500 bg-rose-50 ring-2 ring-rose-500/30", idle: "border-rose-200/80", titleColor: "text-[#BA1A1A]" },
]

const PLACEHOLDERS: Record<PostTypeSelection, { label: string; placeholder: string; required: boolean }> = {
  recomiendo: { label: "Nombre del negocio", placeholder: "Ej: Gasfitería Don Lucho", required: true },
  necesito: { label: "Cuéntalo en pocas palabras", placeholder: "Ej: Una escalera por 2 horas", required: false },
  ofrezco: { label: "Cuéntalo en pocas palabras", placeholder: "Ej: Presto mi taladro los fines de semana", required: false },
  emergencia: { label: "¿Qué está pasando?", placeholder: "Ej: Adulto mayor sin agua", required: false },
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  initialType = "necesito",
  initialEmergencyKind = "NEED",
  userNeighborhood,
  categories,
  emergencyKinds,
  onSubmitPost,
}) => {
  const [selectedType, setSelectedType] = useState<PostTypeSelection>(initialType)
  const [emergencyKind, setEmergencyKind] = useState<EmergencyKindValue>(initialEmergencyKind)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [reference, setReference] = useState("")
  const [phone, setPhone] = useState("")
  const [peopleCount, setPeopleCount] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const options = categories[selectedType] ?? []
  const currentCategory = options.some(o => o.value === category) ? category : options[0]?.value ?? ""
  const text = PLACEHOLDERS[selectedType]

  const handleTypeSelect = (type: PostTypeSelection) => {
    setSelectedType(type)
    setCategory("")
    setSubmitError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    if (text.required && !description.trim()) {
      setSubmitError("Escribe el nombre del negocio que recomiendas.")
      return
    }
    setIsSubmitting(true)
    try {
      const message = await onSubmitPost({
        type: selectedType,
        category: currentCategory,
        categoryLabel: options.find(o => o.value === currentCategory)?.label ?? "",
        description: description.trim(),
        reference: reference.trim(),
        phone: phone.replace(/\D/g, ""),
        emergencyKind,
        peopleCount,
      })
      setSuccessMessage(message)
      setDescription("")
      setReference("")
      setPhone("")
      setPeopleCount(1)
      setTimeout(() => {
        setSuccessMessage("")
        onClose()
      }, 2200)
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
                <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-tight">{t.hint}</p>
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

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700">Categoría</p>
            {options.length === 0 && <p className="text-xs text-gray-400">Cargando categorías…</p>}
            <div className="flex flex-wrap gap-2">
              {options.map(o => (
                <button
                  type="button"
                  key={o.value}
                  aria-pressed={currentCategory === o.value}
                  onClick={() => setCategory(o.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    currentCategory === o.value
                      ? "bg-[#087F72] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="post-text" className="text-xs font-bold text-gray-700">
              {text.label} {!text.required && <span className="font-normal text-gray-400">(opcional)</span>}
            </label>
            <textarea
              id="post-text"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={text.placeholder}
              maxLength={selectedType === "recomiendo" ? 120 : 150}
              className="w-full p-3.5 rounded-2xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 resize-none"
            />
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

          {selectedType !== "emergencia" && (
            <div className="space-y-2">
              <label htmlFor="post-reference" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#087F72]" />
                Referencia en {userNeighborhood} <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="post-reference"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ej: Cerca al parque principal"
                maxLength={200}
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
              />
            </div>
          )}

          <div className="pt-2 space-y-2">
            {submitError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-[#EAF5F1] p-3 text-xs font-semibold text-[#087F72] border border-[#087F72]/30" role="status">
                <Check className="size-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !!successMessage || options.length === 0}
              className={`w-full h-12 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60 ${
                selectedType === "emergencia" ? "bg-[#BA1A1A] hover:bg-[#9B1414]" : "bg-[#087F72] hover:bg-[#075E54]"
              }`}
            >
              {successMessage ? (
                <>
                  <Check className="size-5" />
                  Listo
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
