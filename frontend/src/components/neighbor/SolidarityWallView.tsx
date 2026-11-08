"use client"

import React, { useState, useMemo } from "react"
import { Check, CheckCircle2, HeartHandshake, Plus, RefreshCw } from "lucide-react"
import { FavorItem, FavorType } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { FAVOR_CATEGORIES } from "@/lib/posts"
import { WallActivityPanel } from "@/components/neighbor/WallActivityPanel"

interface SolidarityWallViewProps {
  favors: FavorItem[]
  status: "loading" | "ready" | "error"
  onRetry: () => void
  currentUserId: string
  onRespond: (favor: FavorItem) => Promise<void>
  onOpenCreate: (initialType?: "necesito" | "ofrezco") => void
}

export const SolidarityWallView: React.FC<SolidarityWallViewProps> = ({
  favors,
  status,
  onRetry,
  currentUserId,
  onRespond,
  onOpenCreate,
}) => {
  const [selectedType, setSelectedType] = useState<"todo" | FavorType>("todo")
  const [selectedCategory, setSelectedCategory] = useState<string>("todas")
  const [sentIds, setSentIds] = useState<string[]>([])
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<{ id: string; message: string } | null>(null)

  const filteredFavors = useMemo(() => {
    return favors.filter(f => {
      const matchesType = selectedType === "todo" || f.type === selectedType
      const matchesCategory = selectedCategory === "todas" || f.category === selectedCategory
      return matchesType && matchesCategory
    })
  }, [favors, selectedType, selectedCategory])

  const handleRespond = async (favor: FavorItem) => {
    setRespondError(null)
    setSendingId(favor.id)
    try {
      await onRespond(favor)
      setSentIds(prev => [...prev, favor.id])
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSentIds(prev => [...prev, favor.id])
      } else {
        setRespondError({
          id: favor.id,
          message: err instanceof ApiError ? err.friendlyMessage : "No pudimos enviar tu respuesta.",
        })
      }
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172B2A] tracking-tight">
            Muro solidario
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Favores sin dinero entre vecinos
          </p>
        </div>

        <button
          onClick={() => onOpenCreate("necesito")}
          className="self-start sm:self-auto h-9 px-4 rounded-xl bg-[#087F72] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#075E54] active:scale-98 transition-all"
        >
          <Plus className="size-4" />
          <span>Pedir u ofrecer favor</span>
        </button>
      </div>

      <WallActivityPanel />

      <div className="p-1 rounded-2xl bg-gray-100 flex items-center max-w-md">
        <button
          onClick={() => setSelectedType("todo")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedType === "todo"
              ? "bg-white text-[#172B2A] shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Todo
        </button>
        <button
          onClick={() => setSelectedType("necesito")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedType === "necesito"
              ? "bg-white text-[#8A5800] shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Necesito
        </button>
        <button
          onClick={() => setSelectedType("ofrezco")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedType === "ofrezco"
              ? "bg-white text-[#087F72] shadow-xs"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Ofrezco
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("todas")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === "todas"
              ? "bg-[#087F72] text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          Todas
        </button>
        {FAVOR_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-[#087F72] text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <div className="space-y-3.5">
        {status === "loading" && (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-500">
            <div className="size-7 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">Cargando el muro…</p>
          </div>
        )}

        {status === "error" && (
          <div className="py-10 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-3">
            <p className="text-sm font-bold text-gray-700">No pudimos cargar el muro</p>
            <p className="text-xs text-gray-500">Revisa tu conexión a internet e intenta otra vez.</p>
            <button
              onClick={onRetry}
              className="mx-auto h-9 px-4 rounded-xl border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center gap-1.5 hover:bg-[#EAF5F1]"
            >
              <RefreshCw className="size-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {status === "ready" &&
          filteredFavors.map(favor => {
            if (favor.isResolved) {
              return (
                <div
                  key={favor.id}
                  className="p-4 rounded-2xl bg-[#EAF5F1] border border-[#087F72]/30 flex items-start gap-3 shadow-2xs"
                >
                  <div className="size-6 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 text-emerald-700 shadow-2xs">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#087F72]">{favor.title}</p>
                    <p className="text-xs text-emerald-900 font-medium">
                      {favor.resolvedNote || "Favor completado entre vecinos solidarios."}
                    </p>
                  </div>
                </div>
              )
            }

            const isNecesito = favor.type === "necesito"
            const isMine = favor.authorId === currentUserId
            const isSent = sentIds.includes(favor.id)
            const isSending = sendingId === favor.id

            return (
              <div
                key={favor.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      isNecesito
                        ? "bg-amber-100 text-[#8A5800]"
                        : "bg-[#d4f3eb] text-[#087F72]"
                    }`}
                  >
                    {isNecesito ? "Necesito" : "Ofrezco"}
                  </span>
                  <span className="text-xs font-medium text-gray-400">·</span>
                  <span className="text-xs font-medium text-gray-500">{favor.category}</span>
                </div>

                <h3 className="text-base font-bold text-[#172B2A] leading-snug">
                  {favor.title}
                </h3>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-gray-500 font-medium">
                    {favor.author} · {favor.distanceText} · {favor.timeAgo}
                  </p>

                  {isMine ? (
                    <span className="shrink-0 text-[11px] font-bold text-gray-400">Tu publicación</span>
                  ) : isSent ? (
                    <span className="shrink-0 h-8 px-3 rounded-xl bg-[#EAF5F1] text-[#087F72] font-bold text-xs flex items-center gap-1">
                      <Check className="size-3.5" />
                      Respuesta enviada
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRespond(favor)}
                      disabled={isSending}
                      className="shrink-0 h-8 px-4 rounded-xl border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center justify-center hover:bg-[#EAF5F1] active:scale-98 transition-all disabled:opacity-60"
                    >
                      {isSending ? "Enviando…" : isNecesito ? "Yo te ayudo" : "Me interesa"}
                    </button>
                  )}
                </div>

                {isSent && (
                  <p className="text-[11px] text-gray-500">
                    Cuando {favor.author} acepte tu respuesta, verás su número en “Mi actividad” para coordinar.
                  </p>
                )}
                {respondError?.id === favor.id && (
                  <p className="text-[11px] font-semibold text-rose-600">{respondError.message}</p>
                )}
              </div>
            )
          })}

        {status === "ready" && filteredFavors.length === 0 && (
          <div className="py-12 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-2">
            <HeartHandshake className="size-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No hay solicitudes en esta sección</p>
            <p className="text-xs text-gray-400">
              ¿Tienes algo para prestar o necesitas apoyo? Crea una publicación solidaria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
