"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Check, MessageCircle, Phone, ThumbsUp } from "lucide-react"
import { BusinessDetail } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { businessesApi, RecommendInput } from "@/lib/businesses"
import { formatDistance, useCatalog } from "@/lib/catalog"
import { timeAgo, whatsappLink } from "@/lib/posts"
import { CategoryIcon, categoryTone } from "@/components/ui/category-icon"
import { RichText } from "@/components/ui/rich-text"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useDialog } from "@/lib/use-dialog"

interface BusinessDetailModalProps {
  businessId: number | null
  location: { lat: number; lng: number }
  onClose: () => void
  onChanged: () => void
}

type TagKey = keyof Omit<RecommendInput, "comment">

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2)
  return letters.toUpperCase()
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ businessId, location, onClose, onChanged }) => {
  const { catalog } = useCatalog()
  const tags = (catalog?.recommendationTags ?? []).map(t => ({ key: t.value as TagKey, label: t.label }))
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [error, setError] = useState("")
  const [recommending, setRecommending] = useState(false)
  const [form, setForm] = useState<RecommendInput>({ goodPrice: false, punctual: false, reliable: false, comment: "" })
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setBusiness(null)
    setError("")
    setRecommending(false)
    setForm({ goodPrice: false, punctual: false, reliable: false, comment: "" })
    onClose()
  }, [onClose])

  useDialog(businessId !== null, dialogRef, close)

  useEffect(() => {
    if (businessId === null) return
    let cancelled = false
    businessesApi
      .detail(businessId, location)
      .then(data => {
        if (!cancelled) setBusiness(data)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof ApiError ? err.friendlyMessage : "No pudimos cargar este negocio.")
      })
    return () => {
      cancelled = true
    }
  }, [businessId, location])

  if (businessId === null) return null

  const submitRecommendation = async () => {
    if (!business) return
    setSaving(true)
    setError("")
    try {
      const updated = await businessesApi.recommend(business.id, { ...form, comment: form.comment?.trim() || undefined })
      setBusiness({ ...updated, distanceMeters: business.distanceMeters })
      setRecommending(false)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : "No pudimos guardar tu recomendación.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={business?.name ?? "Ficha del negocio"}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg min-h-screen sm:min-h-0 sm:max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className={`relative h-40 flex items-center justify-center shrink-0 ${business ? categoryTone(business.categorySlug) : "bg-gray-100"}`}>
          <button
            onClick={close}
            className="absolute top-4 left-4 size-10 rounded-full bg-white text-gray-700 shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            aria-label="Volver"
          >
            <ArrowLeft className="size-5" />
          </button>
          {business && (
            <div className="size-24 rounded-3xl bg-white/70 flex items-center justify-center shadow-inner">
              <CategoryIcon name={business.categoryIcon} className="size-12" />
            </div>
          )}
        </div>

        {!business && !error && (
          <div className="p-8 flex items-center gap-2 text-sm text-gray-500">
            <div className="size-5 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
            Cargando…
          </div>
        )}

        {error && !business && <p className="p-6 text-sm font-semibold text-rose-600">{error}</p>}

        {business && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <div>
              <h2 className="text-2xl font-black text-[#172B2A] tracking-tight">{business.name}</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {business.categoryName}
                {business.distanceMeters !== null && ` · a ${formatDistance(business.distanceMeters)}`}
                {" · "}
                <span className={business.openNow ? "text-emerald-700 font-bold" : ""}>{business.scheduleText}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {business.neighborhood}
                {business.reference && ` · ${business.reference}`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#EAF5F1] border border-[#087F72]/20 flex items-center gap-3">
              <div className="flex -space-x-2 shrink-0">
                {business.recommendations.slice(0, 3).map((r, i) => (
                  <span
                    key={i}
                    className="size-7 rounded-full bg-white text-[#087F72] text-xs font-bold flex items-center justify-center border-2 border-[#EAF5F1]"
                  >
                    {initials(r.author)}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold text-[#087F72] leading-tight">
                {business.recommendationsCount === 1
                  ? "Recomendado por 1 vecino"
                  : `Recomendado por ${business.recommendationsCount} vecinos`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <span key={t.key} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
                  {t.label} · {business.tags[t.key]}
                </span>
              ))}
            </div>

            {(business.description || business.priceHint) && (
              <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                {business.description && <p>{business.description}</p>}
                {business.priceHint && (
                  <p className="font-semibold text-gray-800">
                    Precio aproximado: <span className="text-[#087F72]">{business.priceHint}</span>
                  </p>
                )}
              </div>
            )}

            {business.phone && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappLink(business.phone, `Hola ${business.name}, te escribo porque te recomendaron en Ayni.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-xl bg-[#087F72] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#075E54]"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
                <a
                  href={`tel:+${business.phone}`}
                  className="h-11 rounded-xl bg-white border border-[#087F72] text-[#087F72] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#EAF5F1]"
                >
                  <Phone className="size-4" />
                  Llamar
                </a>
              </div>
            )}

            {business.recommendedByMe ? (
              <p className="h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-sm flex items-center justify-center gap-2">
                <Check className="size-4 text-[#087F72]" />
                Ya lo recomendaste
              </p>
            ) : recommending ? (
              <div className="rounded-2xl border-2 border-[#F59E0B]/50 p-4 space-y-3">
                <p className="text-sm font-bold text-[#172B2A]">¿Qué destacas de este lugar?</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={form[t.key]}
                      onClick={() => setForm(f => ({ ...f, [t.key]: !f[t.key] }))}
                      className={`h-10 px-4 rounded-full border-2 text-sm font-semibold ${
                        form[t.key] ? "border-[#087F72] bg-[#EAF5F1] text-[#087F72]" : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <RichTextEditor
                  value={form.comment ?? ""}
                  onChange={comment => setForm(f => ({ ...f, comment }))}
                  maxLength={1000}
                  label="Tu comentario"
                  placeholder="Cuéntale a tus vecinos tu experiencia (opcional)"
                  minHeight={80}
                />
                {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setRecommending(false)} className="h-11 rounded-xl border border-gray-300 text-sm font-bold text-gray-700">
                    Cancelar
                  </button>
                  <button
                    onClick={submitRecommendation}
                    disabled={saving}
                    className="h-11 rounded-xl bg-[#FCD34D] hover:bg-[#F59E0B] text-[#78350F] text-sm font-bold disabled:opacity-60"
                  >
                    {saving ? "Guardando…" : "Recomendar"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setRecommending(true)}
                className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#FCD34D] hover:bg-[#F59E0B] text-[#78350F]"
              >
                <ThumbsUp className="size-4" />
                Lo recomiendo
              </button>
            )}

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-extrabold text-[#172B2A]">Lo que dicen los vecinos</h3>
              {business.recommendations.filter(r => r.comment).length === 0 && (
                <p className="text-xs text-gray-500">Todavía nadie dejó un comentario.</p>
              )}
              {business.recommendations
                .filter(r => r.comment)
                .map((r, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-white border border-gray-200/80 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-full bg-[#EAF5F1] text-[#087F72] text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(r.author)}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{r.author}</p>
                        <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
                      </div>
                    </div>
                    <RichText value={r.comment ?? ""} className="text-sm text-gray-600 pl-9 leading-relaxed" />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
