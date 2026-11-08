"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Check, Navigation, X } from "lucide-react"
import { EmergencyReport, FavorItem, MapItem, SupportPoint } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { emergencyApi } from "@/lib/emergency"
import { formatDistance } from "@/lib/catalog"
import { directionsUrl, type LatLng } from "@/lib/map"
import { postsApi } from "@/lib/posts"
import { useDialog } from "@/lib/use-dialog"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { RichText } from "@/components/ui/rich-text"
import { DEFAULT_RESPONSE, respondSpec } from "@/lib/confirm-specs"
import { ReportCard, SupportPointCard, useReportActions } from "@/components/neighbor/emergency-parts"

const LAYER_TITLE: Record<string, string> = {
  wall: "Muro solidario",
  emergencies: "Emergencia",
  supportPoints: "Punto de apoyo",
}

interface ItemDetailSheetProps {
  item: MapItem
  from: LatLng
  supportPoints: SupportPoint[]
  approximateRadius: number
  onClose: () => void
  onChanged: () => void
}

function Loading() {
  return (
    <div className="py-10 flex justify-center">
      <div className="size-7 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
    </div>
  )
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-center space-y-3">
      <p className="text-[17px] font-bold text-gray-800">No pudimos cargar la ficha</p>
      <button onClick={onRetry} className="h-12 px-5 rounded-xl border-2 border-[#087F72] text-[#087F72] text-[15px] font-bold">
        Reintentar
      </button>
    </div>
  )
}

function PostDetail({ item, approximateRadius, onChanged }: { item: MapItem; approximateRadius: number; onChanged: () => void }) {
  const [post, setPost] = useState<FavorItem | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const { ask, dialog } = useConfirm()

  useEffect(() => {
    let cancelled = false
    postsApi
      .get(item.id)
      .then(data => {
        if (!cancelled) setPost(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [item.id, reloadKey])

  if (failed && !post)
    return (
      <LoadFailed
        onRetry={() => {
          setFailed(false)
          setReloadKey(k => k + 1)
        }}
      />
    )
  if (!post) return <Loading />

  const request = post.type === "necesito"

  const respond = async () => {
    const message = await ask(respondSpec(request ? "REQUEST" : "OFFER", post.author, post.title))
    if (message === null) return
    setSending(true)
    setError("")
    try {
      await postsApi.respond(post.id, message || DEFAULT_RESPONSE[request ? "REQUEST" : "OFFER"])
      setPost({ ...post, respondedByMe: true })
      onChanged()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setPost({ ...post, respondedByMe: true })
      else setError(err instanceof ApiError ? err.friendlyMessage : "No pudimos enviar tu respuesta.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <span
        className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold ${
          request ? "bg-[#FFF8E6] text-[#8A5800]" : "bg-[#EAF5F1] text-[#087F72]"
        }`}
      >
        {request ? "Necesita" : "Ofrece"}
      </span>
      <h2 className="text-[22px] font-bold leading-tight text-[#172B2A]">{post.title}</h2>
      <p className="text-[15px] text-gray-600">
        {[post.categoryLabel, post.author, post.distanceText, post.timeAgo].filter(Boolean).join(" · ")}
        {item.distanceMeters !== null && ` · a ${item.approximate ? "unos " : ""}${formatDistance(item.distanceMeters)}`}
      </p>
      {post.details && <RichText value={post.details} className="text-[17px] leading-snug text-[#1C1917]" />}
      {post.isResolved && (
        <p className="rounded-xl bg-emerald-50 p-3 text-[15px] font-semibold text-emerald-900">Esta publicación ya se resolvió.</p>
      )}
      {item.approximate && (
        <p className="text-[15px] text-gray-600">
          Ubicación aproximada (unos {approximateRadius} m) para cuidar la privacidad del vecino.
        </p>
      )}
      {error && (
        <p className="text-[15px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-2.5">
        {item.mine ? (
          <p className="h-14 rounded-2xl bg-gray-100 text-gray-600 text-[17px] font-bold flex items-center justify-center">
            Es tu publicación
          </p>
        ) : post.respondedByMe ? (
          <>
            <p className="h-14 rounded-2xl bg-[#EAF5F1] text-[#087F72] text-[17px] font-bold flex items-center justify-center gap-2">
              <Check className="size-5" />
              Respuesta enviada
            </p>
            <p className="text-[15px] text-gray-600">
              Cuando {post.author} acepte tu respuesta, verás su número en «Mi actividad» del muro.
            </p>
          </>
        ) : (
          !post.isResolved && (
            <button
              onClick={respond}
              disabled={sending}
              className="h-14 rounded-2xl bg-[#087F72] hover:bg-[#075E54] text-white text-[17px] font-bold disabled:opacity-60"
            >
              {sending ? "Enviando…" : request ? "Yo te ayudo" : "Me interesa"}
            </button>
          )
        )}
        {!item.approximate && !item.mine && (
          <a
            href={directionsUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 rounded-2xl border-2 border-[#087F72] text-[#087F72] text-[17px] font-bold flex items-center justify-center gap-2"
          >
            <Navigation className="size-5" />
            Cómo llegar
          </a>
        )}
      </div>
      {dialog}
    </div>
  )
}

function ReportDetail({ item, from, onChanged }: { item: MapItem; from: LatLng; onChanged: () => void }) {
  const [report, setReport] = useState<EmergencyReport | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const changed = useCallback(() => {
    setReloadKey(k => k + 1)
    onChanged()
  }, [onChanged])
  const { perform, busyId, error, dialog } = useReportActions(changed)

  useEffect(() => {
    let cancelled = false
    emergencyApi
      .detail(item.id, from)
      .then(data => {
        if (cancelled) return
        setReport(data)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [item.id, from, reloadKey])

  if (failed && !report) return <LoadFailed onRetry={() => setReloadKey(k => k + 1)} />
  if (!report) return <Loading />

  return (
    <div className="space-y-3">
      <p className="text-[15px] text-gray-600">
        {report.kindLabel} · {report.statusLabel}
        {report.neighborhood && ` · ${report.neighborhood}`}
      </p>
      {error && (
        <p className="text-[15px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}
      <ReportCard rep={report} busy={busyId === report.id} onAction={action => perform(report, action)} />
      {report.approximate && (
        <p className="text-[15px] text-gray-600">
          La ubicación es aproximada hasta que respondas. Así cuidamos la privacidad de quien reportó.
        </p>
      )}
      {dialog}
    </div>
  )
}

function PointDetail({ item, supportPoints }: { item: MapItem; supportPoints: SupportPoint[] }) {
  const point = supportPoints.find(p => p.id === item.id)
  if (point) return <SupportPointCard point={{ ...point, distanceMeters: item.distanceMeters ?? point.distanceMeters }} />
  return (
    <div className="space-y-3">
      <h2 className="text-[22px] font-bold leading-tight text-[#172B2A]">{item.title}</h2>
      <p className="text-[15px] text-gray-600">{[item.subtitle, item.badge].filter(Boolean).join(" · ")}</p>
      <a
        href={directionsUrl(item)}
        target="_blank"
        rel="noopener noreferrer"
        className="h-14 rounded-2xl border-2 border-[#087F72] text-[#087F72] text-[17px] font-bold flex items-center justify-center gap-2"
      >
        <Navigation className="size-5" />
        Cómo llegar
      </a>
    </div>
  )
}

export function ItemDetailSheet({ item, from, supportPoints, approximateRadius, onClose, onChanged }: ItemDetailSheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  useDialog(true, ref, onClose)

  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha: ${item.title}`}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#F8FAFC] rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-xs px-5 pt-4 pb-3 flex items-center justify-between">
          <p className="text-[15px] font-bold text-gray-500">{LAYER_TITLE[item.layer] ?? "Ficha"}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="size-11 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 pb-6">
          {item.layer === "wall" && <PostDetail item={item} approximateRadius={approximateRadius} onChanged={onChanged} />}
          {item.layer === "emergencies" && <ReportDetail item={item} from={from} onChanged={onChanged} />}
          {item.layer === "supportPoints" && <PointDetail item={item} supportPoints={supportPoints} />}
        </div>
      </div>
    </div>
  )
}
