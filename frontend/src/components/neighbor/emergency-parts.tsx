"use client"

import React, { useState } from "react"
import { BadgeCheck, Check, Clock, HeartHandshake, MessageCircle, Navigation, Phone } from "lucide-react"
import { EmergencyReport, SupportPoint } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { emergencyApi } from "@/lib/emergency"
import { formatDistance } from "@/lib/catalog"
import { directionsUrl } from "@/lib/map"
import { timeAgo } from "@/lib/posts"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { attendedSpec, claimSpec, onTheWaySpec, RELEASE_SPEC } from "@/lib/confirm-specs"

export type ReportAction = "onTheWay" | "claim" | "release" | "attended"

const SEVERITY_STYLE: Record<EmergencyReport["severity"], string> = {
  HIGH: "bg-rose-100 text-rose-800",
  MEDIUM: "bg-amber-100 text-amber-900",
  LOW: "bg-gray-100 text-gray-700",
}

const actionButton = "h-12 px-4 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"

function specFor(rep: EmergencyReport, action: ReportAction) {
  if (action === "onTheWay") return onTheWaySpec(rep.title, rep.reporter)
  if (action === "claim") return claimSpec(rep.title, rep.reporter)
  if (action === "release") return RELEASE_SPEC
  return attendedSpec(rep.kind === "OFFER")
}

function runAction(rep: EmergencyReport, action: ReportAction, message: string) {
  if (action === "onTheWay") return emergencyApi.onTheWay(rep.id, message)
  if (action === "claim") return emergencyApi.claim(rep.id, message)
  if (action === "release") return emergencyApi.release(rep.id)
  return emergencyApi.attended(rep.id)
}

export function useReportActions(onChanged: () => void) {
  const { ask, dialog } = useConfirm()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const perform = async (rep: EmergencyReport, action: ReportAction) => {
    const message = await ask(specFor(rep, action))
    if (message === null) return
    setBusyId(rep.id)
    setError("")
    try {
      await runAction(rep, action, message)
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : "No pudimos guardar el cambio.")
    } finally {
      setBusyId(null)
      onChanged()
    }
  }

  return { perform, busyId, error, dialog }
}

export function ReportCard({
  rep,
  busy,
  onAction,
}: {
  rep: EmergencyReport
  busy: boolean
  onAction: (action: ReportAction) => void
}) {
  const offer = rep.kind === "OFFER"
  const closed = rep.status === "ATTENDED"
  const canCall = rep.reporterPhone && !rep.mine && !closed
  const canNavigate = !rep.approximate && !rep.mine && !closed

  return (
    <article
      className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-3 ${
        rep.status === "URGENT" ? "border-rose-300 ring-1 ring-rose-100" : "border-gray-200"
      } ${closed ? "opacity-75" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h3 className="text-[17px] font-bold leading-snug text-[#172B2A] flex items-center gap-1.5">
            <span className="min-w-0">{rep.title}</span>
            {rep.verified && <BadgeCheck className="size-5 shrink-0 text-[#087F72]" aria-label="Verificado por la junta" />}
          </h3>
          <p className="text-[15px] text-gray-600">
            {offer ? `Ofrece ${rep.reporter}` : `${rep.peopleCount} ${rep.peopleCount === 1 ? "persona" : "personas"}`} ·{" "}
            {rep.categoryLabel}
            {rep.distanceMeters !== null && ` · a ${formatDistance(rep.distanceMeters)}`} · {timeAgo(rep.createdAt)}
          </p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold ${SEVERITY_STYLE[rep.severity]}`}>
          {offer ? "Recurso" : rep.severityLabel}
        </span>
      </div>

      {rep.vulnerable.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Personas vulnerables">
          {rep.vulnerable.map(v => (
            <li key={v.value} className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-sm font-semibold text-amber-900">
              {v.label}
            </li>
          ))}
        </ul>
      )}

      {rep.helperMessage && !rep.helpingByMe && (
        <p className="rounded-xl bg-amber-50 p-3 text-[15px] text-amber-950 flex items-start gap-2">
          <MessageCircle className="size-4 mt-1 shrink-0" />
          <span>
            <strong>{rep.helper}:</strong> {rep.helperMessage}
          </span>
        </p>
      )}

      {offer && rep.mine && rep.claimers.length > 0 && !closed && (
        <div className="rounded-xl bg-[#EAF5F1] p-3 space-y-2.5">
          <p className="text-[15px] font-semibold text-[#075E54]">
            {rep.claimers.length === 1 ? "1 vecino lo necesita:" : `${rep.claimers.length} vecinos lo necesitan:`}
          </p>
          {rep.claimers.map(c => (
            <div key={c.phone} className="space-y-1.5">
              <a
                href={`tel:+${c.phone}`}
                className="h-11 w-fit px-3.5 rounded-xl bg-white border border-[#087F72] text-[#087F72] text-[15px] font-bold flex items-center gap-1.5"
              >
                <Phone className="size-4" />
                Llamar a {c.name}
              </a>
              {c.message && <p className="text-[15px] text-[#075E54]">«{c.message}»</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!offer && rep.status === "URGENT" && !rep.mine && (
          <button
            disabled={busy}
            onClick={() => onAction("onTheWay")}
            className={`${actionButton} bg-[#BA1A1A] text-white hover:bg-[#991515]`}
          >
            {busy ? "Avisando…" : "Voy en camino"}
          </button>
        )}
        {!offer && rep.status === "URGENT" && rep.mine && (
          <p className="text-[15px] font-bold text-rose-700">Esperando que alguien responda</p>
        )}
        {!offer && rep.status === "ON_THE_WAY" && (
          <span className="h-12 px-3.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-[15px] font-bold flex items-center">
            {rep.helpingByMe ? "Vas en camino" : rep.helper ? `${rep.helper} va en camino` : rep.statusLabel}
          </span>
        )}
        {offer && rep.status === "AVAILABLE" && !rep.mine && !rep.claimedByMe && (
          <button
            disabled={busy}
            onClick={() => onAction("claim")}
            className={`${actionButton} bg-[#087F72] text-white hover:bg-[#075E54]`}
          >
            <HeartHandshake className="size-5" />
            {busy ? "Avisando…" : "Lo necesito"}
          </button>
        )}
        {offer && rep.claimedByMe && !closed && (
          <span className="h-12 px-3.5 rounded-xl bg-[#EAF5F1] text-[#075E54] text-[15px] font-bold flex items-center gap-1.5">
            <Check className="size-4" />
            Ya le avisaste
          </span>
        )}
        {canCall && (
          <a href={`tel:+${rep.reporterPhone}`} className={`${actionButton} border-2 border-[#172B2A] text-[#172B2A]`}>
            <Phone className="size-4" />
            Llamar a {rep.reporter}
          </a>
        )}
        {canNavigate && (
          <a
            href={directionsUrl(rep)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionButton} border-2 border-[#087F72] text-[#087F72]`}
          >
            <Navigation className="size-4" />
            Cómo llegar
          </a>
        )}
        {!offer && rep.status === "ON_THE_WAY" && rep.helpingByMe && (
          <button
            disabled={busy}
            onClick={() => onAction("release")}
            className={`${actionButton} border-2 border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            Ya no puedo ir
          </button>
        )}
        {!closed && (rep.mine || rep.helpingByMe) && (
          <button
            disabled={busy}
            onClick={() => onAction("attended")}
            className={`${actionButton} bg-emerald-100 text-emerald-900 border border-emerald-300`}
          >
            {offer ? "Ya no hay" : "Ya está atendido"}
          </button>
        )}
        {closed && (
          <span className="h-10 px-3 rounded-xl bg-emerald-50 text-emerald-900 text-[15px] font-bold flex items-center">
            {rep.statusLabel}
          </span>
        )}
      </div>

      {offer && !rep.mine && !rep.claimedByMe && rep.claimCount > 0 && !closed && (
        <p className="text-sm text-gray-600">
          {rep.claimCount === 1 ? "1 vecino lo pidió" : `${rep.claimCount} vecinos lo pidieron`}
        </p>
      )}
    </article>
  )
}

export function SupportPointCard({ point }: { point: SupportPoint }) {
  return (
    <article className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-[17px] font-bold leading-snug text-[#172B2A]">{point.name}</h3>
          <p className="text-[15px] text-gray-600">
            {point.typeLabel}
            {point.address && ` · ${point.address}`}
            {point.distanceMeters !== null && ` · a ${formatDistance(point.distanceMeters)}`}
          </p>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold ${
            point.open ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
          }`}
        >
          {point.open ? "Abierto" : "Cerrado"}
        </span>
      </div>
      {point.hours && (
        <p className="text-[15px] text-gray-700 flex items-center gap-1.5">
          <Clock className="size-4 text-gray-500" />
          Horario: {point.hours}
        </p>
      )}
      {point.resources.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Qué ofrece">
          {point.resources.map(r => (
            <li key={r.value} className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-sm font-semibold text-blue-900">
              {r.label}
            </li>
          ))}
        </ul>
      )}
      <a
        href={directionsUrl(point)}
        target="_blank"
        rel="noopener noreferrer"
        className="h-12 w-full sm:w-auto sm:inline-flex px-4 rounded-xl border-2 border-[#087F72] text-[#087F72] text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-[#EAF5F1]"
      >
        <Navigation className="size-4" />
        Cómo llegar
      </a>
    </article>
  )
}
