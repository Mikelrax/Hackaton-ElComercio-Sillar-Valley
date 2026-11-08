"use client"

import React, { useState, useEffect } from "react"
import { X, MapPin, Check, AlertCircle } from "lucide-react"
import { FavorCategory } from "@/lib/types"
import { ApiError } from "@/lib/api"

export type PostTypeSelection = "recomiendo" | "necesito" | "ofrezco" | "emergencia"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: PostTypeSelection
  userNeighborhood: string
  onSubmitPost: (data: {
    type: PostTypeSelection
    category: string
    description: string
    location: string
  }) => Promise<string>
}

const NECESITO: FavorCategory[] = ["Herramientas", "Hogar", "Cuidado", "Alimentos", "Movilidad", "Salud", "Educación", "Otros"]
const OFREZCO: FavorCategory[] = ["Herramientas", "Educación", "Hogar", "Cuidado", "Alimentos", "Movilidad", "Salud", "Otros"]

const CATEGORY_OPTIONS: Record<PostTypeSelection, string[]> = {
  recomiendo: ["Gasfitería", "Comida casera", "Costura", "Bodega", "Técnico", "Salud"],
  necesito: NECESITO,
  ofrezco: OFREZCO,
  emergencia: ["Agua potable", "Refugio", "Medicinas", "Rescate", "Primeros auxilios"],
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  initialType = "necesito",
  userNeighborhood,
  onSubmitPost,
}) => {
  const [selectedType, setSelectedType] = useState<PostTypeSelection>(initialType)
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[initialType][0])
  const [description, setDescription] = useState("")
  const [locationText, setLocationText] = useState(
    userNeighborhood ? `${userNeighborhood}, cerca al parque` : "Urb. Las Flores, cerca al parque"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleTypeSelect = (type: PostTypeSelection) => {
    setSelectedType(type)
    setCategory(CATEGORY_OPTIONS[type][0])
    setSubmitError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setIsSubmitting(true)
    try {
      const message = await onSubmitPost({
        type: selectedType,
        category,
        description: description.trim(),
        location: locationText,
      })
      setSuccessMessage(message)
      setShowSuccess(true)
      setDescription("")
      setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage("")
        onClose()
      }, 2200)
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.friendlyMessage : "No pudimos publicar. Intenta otra vez."
      )
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
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md min-h-screen sm:min-h-0 bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="size-4" />
          </button>
          <span className="text-xs font-bold text-gray-400">Toque 2 de 3</span>
          <div className="size-9" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          <h2 className="text-xl sm:text-2xl font-black text-[#172B2A] tracking-tight">
            ¿Qué quieres publicar?
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeSelect("recomiendo")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedType === "recomiendo"
                  ? "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-black text-[#172B2A]">Recomiendo</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Un negocio o servicio</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect("necesito")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedType === "necesito"
                  ? "border-[#D97706] bg-[#FFF8E6] ring-2 ring-[#D97706]/30 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-black text-[#8A5800]">Necesito</p>
              <p className="text-[11px] text-amber-900/70 font-medium mt-0.5">Pide un favor</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect("ofrezco")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedType === "ofrezco"
                  ? "border-[#087F72] bg-[#EAF5F1] ring-2 ring-[#087F72]/30 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-black text-[#087F72]">Ofrezco</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Presta o regala algo</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect("emergencia")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedType === "emergencia"
                  ? "border-rose-500 bg-rose-50 ring-2 ring-rose-500/30 shadow-xs"
                  : "border-rose-200/80 bg-white hover:border-rose-300"
              }`}
            >
              <p className="text-sm font-black text-[#BA1A1A]">Emergencia</p>
              <p className="text-[11px] text-rose-900/70 font-medium mt-0.5 leading-tight">
                Alguien necesita ayuda ya
              </p>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS[selectedType].map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    category === cat
                      ? "bg-[#087F72] text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">
              Cuéntalo en pocas palabras <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Una escalera por 2 horas, taladro, o apoyo con compra"
              className="w-full p-3.5 rounded-2xl bg-white border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 resize-none shadow-2xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <MapPin className="size-4 text-[#087F72] shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Tu ubicación (GPS)</p>
                <p className="text-[11px] text-gray-500">{locationText}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const updated = prompt("Ajustar dirección de referencia:", locationText)
                if (updated) setLocationText(updated)
              }}
              className="text-xs font-bold text-[#087F72] hover:underline"
            >
              Ajustar
            </button>
          </div>

          <div className="pt-2 space-y-2">
            {submitError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="size-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            {showSuccess && successMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-[#EAF5F1] p-3 text-xs font-semibold text-[#087F72] border border-[#087F72]/30">
                <Check className="size-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting || showSuccess}
              className="w-full h-12 rounded-xl bg-[#087F72] hover:bg-[#075E54] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {showSuccess ? (
                <>
                  <Check className="size-5 text-white" />
                  <span>Listo</span>
                </>
              ) : isSubmitting ? (
                <span>Publicando...</span>
              ) : (
                <span>Publicar</span>
              )}
            </button>

            <p className="text-[11px] text-center text-gray-400 font-medium">
              Ubicación y categoría ya vienen llenas: solo tocas Publicar.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
