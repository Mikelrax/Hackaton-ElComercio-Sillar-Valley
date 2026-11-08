// src/components/neighbor/BusinessDetailModal.tsx
// Ficha de detalle de negocio / servicio (Pantalla 2 del Figma)
"use client"

import React, { useState } from "react"
import { ArrowLeft, Phone, ThumbsUp, Wrench, Utensils, Scissors, Store, Sparkles, Check, Share2, MessageCircle } from "lucide-react"
import { BusinessItem } from "@/lib/types"

interface BusinessDetailModalProps {
  business: BusinessItem | null
  onClose: () => void
  onRecommend: (businessId: string) => void
  userHasRecommended?: boolean
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  onClose,
  onRecommend,
  userHasRecommended = false,
}) => {
  const [recommended, setRecommended] = useState(userHasRecommended)
  const [recommendCount, setRecommendCount] = useState(business?.recommendationsCount || 0)

  if (!business) return null

  const handleRecommendClick = () => {
    if (!recommended) {
      setRecommended(true)
      setRecommendCount(prev => prev + 1)
      onRecommend(business.id)
    }
  }

  // Icono principal según categoría
  const getCategoryIcon = () => {
    switch (business.category) {
      case "Gasfitería":
        return <Wrench className="size-16 text-[#087F72]" strokeWidth={1.8} />
      case "Comida casera":
        return <Utensils className="size-16 text-[#F2A900]" strokeWidth={1.8} />
      case "Costura":
        return <Scissors className="size-16 text-indigo-600" strokeWidth={1.8} />
      case "Bodega":
        return <Store className="size-16 text-rose-600" strokeWidth={1.8} />
      default:
        return <Sparkles className="size-16 text-[#087F72]" strokeWidth={1.8} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* ================= CABECERA ILUSTRADA ================= */}
        <div className="relative h-48 sm:h-52 bg-[#d7f5f0] flex items-center justify-center shrink-0">
          {/* Botón Volver (Figma: círculo blanco flotante) */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 size-10 rounded-full bg-white text-gray-700 shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            aria-label="Volver atrás"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Icono de Oficio */}
          <div className="size-28 rounded-3xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-inner">
            {getCategoryIcon()}
          </div>
        </div>

        {/* ================= CONTENIDO CON SCROLL ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Título y Horario */}
          <div>
            <h2 className="text-2xl font-black text-[#172B2A] tracking-tight">{business.name}</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {business.category} · a {business.distanceText} · {business.scheduleText}
            </p>
          </div>

          {/* Banner de Recomendación Vecinal (Figma: tarjeta cyan/menta suave con avatares) */}
          <div className="p-3.5 rounded-2xl bg-[#EAF5F1] border border-[#087F72]/20 flex items-center gap-3">
            {/* Avatares circulares de vecinos */}
            <div className="flex -space-x-2 shrink-0">
              <span className="size-7 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                CR
              </span>
              <span className="size-7 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                JP
              </span>
              <span className="size-7 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                AL
              </span>
            </div>
            <p className="text-xs font-bold text-[#087F72] leading-tight">
              Recomendado por {recommendCount} vecinos de tu zona
            </p>
          </div>

          {/* Tags de Reputación Comunitarias (Figma: chips redondeados con contadores) */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-2xs">
              Buen precio · {business.reputationTags.goodPrice}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-2xs">
              Puntual · {business.reputationTags.punctual}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-2xs">
              Confiable · {business.reputationTags.reliable}
            </span>
          </div>

          {/* Descripción y Rango de Precios */}
          <div className="text-xs text-gray-600 leading-relaxed space-y-1">
            <p>{business.description}</p>
            <p className="font-semibold text-gray-800">
              Rango estimado: <span className="text-[#087F72]">{business.estimatedPrice}</span>
            </p>
          </div>

          {/* Botones de Contacto Directo: WhatsApp y Llamar (Figma) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={`https://wa.me/${business.whatsapp}?text=Hola%20${encodeURIComponent(business.name)}%2C%20te%20contacto%20a%20trav%C3%A9s%20de%20AYNI`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-xl bg-[#087F72] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#075E54] active:scale-98 transition-all shadow-sm"
            >
              <MessageCircle className="size-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`tel:${business.phone}`}
              className="h-11 rounded-xl bg-white border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#EAF5F1] active:scale-98 transition-all shadow-sm"
            >
              <Phone className="size-4" />
              <span>Llamar</span>
            </a>
          </div>

          {/* Botón Principal Dorado: "👍 Lo recomiendo" (Figma) */}
          <button
            onClick={handleRecommendClick}
            disabled={recommended}
            className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              recommended
                ? "bg-amber-100 text-amber-800 border border-amber-300 cursor-default"
                : "bg-[#F9DA73] hover:bg-[#F2A900] text-[#7A4B00] hover:text-[#523200] active:scale-98"
            }`}
          >
            {recommended ? (
              <>
                <Check className="size-4 text-emerald-700" />
                <span>¡Recomendado por ti!</span>
              </>
            ) : (
              <>
                <ThumbsUp className="size-4" />
                <span>Lo recomiendo</span>
              </>
            )}
          </button>

          {/* Sección: "Lo que dicen los vecinos" (Figma) */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-extrabold text-[#172B2A]">Lo que dicen los vecinos</h3>

            <div className="space-y-2.5">
              {business.reviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-7 rounded-full ${rev.avatarColor} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                      {rev.initials}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{rev.author}</p>
                      <p className="text-[10px] text-gray-400">{rev.timeAgo}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 pl-9 leading-relaxed">
                    «{rev.comment}»
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

