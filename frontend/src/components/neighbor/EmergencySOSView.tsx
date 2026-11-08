"use client"

import React, { useState, useSyncExternalStore } from "react"
import { AlertTriangle, Check, Home, LocateFixed, Phone, RefreshCw, Share2, ShieldCheck, WifiOff } from "lucide-react"
import { EmergencyOverview, Option, SafetyStatus } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { emergencyApi } from "@/lib/emergency"
import { formatDistance } from "@/lib/catalog"
import { directionsUrl } from "@/lib/map"
import { timeAgo } from "@/lib/posts"
import { ReportCard, SupportPointCard, useReportActions } from "@/components/neighbor/emergency-parts"

export type EmergencyOrigin = "home" | "here"

interface EmergencySOSViewProps {
  overview: EmergencyOverview | null
  status: "loading" | "ready" | "error"
  emergencyNumbers: Option[]
  origin: EmergencyOrigin
  locating: boolean
  locateFailed: boolean
  onChooseOrigin: (origin: EmergencyOrigin) => void
  onRetry: () => void
  onChanged: () => void
  onOpenCreate: (kind: "NEED" | "OFFER") => void
  onOpenMap: () => void
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
}

const CHECK_IN_LABEL: Record<SafetyStatus, string> = {
  SAFE: "Tu respuesta «Estoy bien»",
  NEED_HELP: "Tu respuesta «Necesito ayuda»",
}

function shareText(overview: EmergencyOverview, numbers: Option[]): string {
  const mode = overview.mode
  const point = overview.supportPoints.find(p => p.open)
  const lines = [`Aviso de emergencia en el barrio: ${mode.title}`]
  if (mode.message) lines.push(mode.message)
  if (point) {
    lines.push(
      "",
      `Punto de apoyo más cercano: ${point.name} (${point.typeLabel})${point.address ? `, ${point.address}` : ""}`
    )
    if (point.hours) lines.push(`Horario: ${point.hours}`)
    lines.push(`Cómo llegar: ${directionsUrl(point)}`)
  }
  if (numbers.length > 0) {
    lines.push("", `Números de emergencia: ${numbers.map(n => `${n.label} ${n.value}`).join(" · ")}`)
  }
  lines.push("", `Reportes y ayuda en Ayni: ${window.location.origin}`)
  return lines.join("\n")
}

const originChip = (active: boolean) =>
  `h-11 px-3.5 rounded-full text-[15px] font-bold flex items-center gap-1.5 transition-colors ${
    active ? "bg-[#172B2A] text-white" : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
  }`

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({
  overview,
  status,
  emergencyNumbers,
  origin,
  locating,
  locateFailed,
  onChooseOrigin,
  onRetry,
  onChanged,
  onOpenCreate,
  onOpenMap,
}) => {
  const online = useOnline()
  const { perform, busyId, error, dialog } = useReportActions(onChanged)
  const [showAttended, setShowAttended] = useState(false)
  const [answered, setAnswered] = useState<SafetyStatus | null>(null)
  const [changingAnswer, setChangingAnswer] = useState(false)
  const [answerBusy, setAnswerBusy] = useState<SafetyStatus | null>(null)
  const [answerError, setAnswerError] = useState("")

  const answer = async (choice: SafetyStatus) => {
    setAnswerBusy(choice)
    setAnswerError("")
    try {
      await emergencyApi.checkIn(choice, CHECK_IN_LABEL[choice])
      setAnswered(choice)
      setChangingAnswer(false)
      onChanged()
    } catch (err) {
      if (err instanceof ApiError && err.queued) {
        setAnswered(choice)
        setChangingAnswer(false)
      } else {
        setAnswerError(err instanceof ApiError ? err.friendlyMessage : "No pudimos guardar tu respuesta.")
      }
    } finally {
      setAnswerBusy(null)
    }
    if (choice === "NEED_HELP") onOpenCreate("NEED")
  }

  const share = () => {
    if (!overview) return
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(overview, emergencyNumbers))}`, "_blank", "noopener,noreferrer")
  }

  const mode = overview?.mode
  const myAnswer = answered ?? overview?.myCheckIn ?? null
  const askAnswer = mode?.active && (!myAnswer || changingAnswer)
  const active = overview?.reports.filter(r => r.status !== "ATTENDED") ?? []
  const attended = overview?.reports.filter(r => r.status === "ATTENDED") ?? []
  const place = origin === "here" ? "de donde estás" : "de tu casa"

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {mode?.active ? (
        <section className="p-4 sm:p-5 rounded-2xl bg-[#BA1A1A] text-white shadow-md space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-7 text-white shrink-0" />
            <div className="space-y-1">
              <h1 className="text-xl font-black tracking-tight leading-tight">Modo emergencia: {mode.title}</h1>
              <p className="text-[15px] text-rose-100">
                Activado por {mode.activatedBy} de la junta vecinal · {mode.activatedAt && timeAgo(mode.activatedAt)}
              </p>
              {mode.message && <p className="text-[17px] leading-snug pt-1">{mode.message}</p>}
            </div>
          </div>
          <button
            onClick={share}
            className="h-12 w-full sm:w-auto px-4 rounded-xl bg-white text-[#BA1A1A] text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-rose-50"
          >
            <Share2 className="size-5" />
            Compartir por WhatsApp
          </button>
        </section>
      ) : (
        <section className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-3">
          <ShieldCheck className="size-7 text-[#087F72] shrink-0" />
          <div className="space-y-1">
            <h1 className="text-xl font-black text-[#172B2A]">No hay una emergencia activa</h1>
            <p className="text-[15px] text-gray-600">
              Si alguien necesita ayuda urgente, avísalo aquí y tus vecinos lo verán.
            </p>
          </div>
        </section>
      )}

      {askAnswer && (
        <section className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#BA1A1A]/40 space-y-3" aria-labelledby="check-in-title">
          <div className="space-y-1">
            <h2 id="check-in-title" className="text-xl font-black text-[#172B2A]">
              ¿Estás bien?
            </h2>
            <p className="text-[15px] text-gray-600">Cuéntale a la junta vecinal cómo estás. Solo toma un toque.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={answerBusy !== null}
              onClick={() => answer("SAFE")}
              className="h-14 rounded-2xl bg-[#087F72] hover:bg-[#075E54] text-white text-[17px] font-bold disabled:opacity-60"
            >
              {answerBusy === "SAFE" ? "Guardando…" : "Estoy bien"}
            </button>
            <button
              disabled={answerBusy !== null}
              onClick={() => answer("NEED_HELP")}
              className="h-14 rounded-2xl bg-[#BA1A1A] hover:bg-[#9B1414] text-white text-[17px] font-bold disabled:opacity-60"
            >
              {answerBusy === "NEED_HELP" ? "Guardando…" : "Necesito ayuda"}
            </button>
          </div>
          {answerError && (
            <p className="text-[15px] font-semibold text-rose-700" role="alert">
              {answerError}
            </p>
          )}
        </section>
      )}

      {mode?.active && myAnswer && !changingAnswer && (
        <section className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-wrap items-center justify-between gap-3" role="status">
          <p className="text-[15px] font-semibold text-[#172B2A] flex items-center gap-2">
            <Check className={`size-5 ${myAnswer === "SAFE" ? "text-[#087F72]" : "text-[#BA1A1A]"}`} />
            {myAnswer === "SAFE" ? "Le contaste a la junta que estás bien." : "Le contaste a la junta que necesitas ayuda."}
          </p>
          <button
            onClick={() => setChangingAnswer(true)}
            className="h-11 px-3.5 rounded-xl border border-gray-300 text-[15px] font-bold text-gray-700 hover:bg-gray-50"
          >
            Cambiar
          </button>
        </section>
      )}

      {!online && (
        <div className="p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-start gap-2.5 text-[15px] text-gray-700">
          <WifiOff className="size-5 text-gray-500 shrink-0 mt-0.5" />
          <p>
            Sin conexión.
            {overview && ` Lo que ves se actualizó ${timeAgo(overview.generatedAt)}.`} Si avisas una emergencia la
            guardamos y se envía sola cuando vuelva la señal. Si es urgente, llama a los números de emergencia.
          </p>
        </div>
      )}

      {emergencyNumbers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" aria-label="Números de emergencia">
          {emergencyNumbers.map(n => (
            <a
              key={n.value}
              href={`tel:${n.value}`}
              className="py-3.5 px-2 rounded-2xl bg-rose-50 border border-rose-200 text-center hover:bg-rose-100"
            >
              <p className="text-xl font-black text-[#BA1A1A] flex items-center justify-center gap-1.5">
                <Phone className="size-5" />
                {n.value}
              </p>
              <p className="text-[15px] font-bold text-rose-900 mt-0.5">{n.label}</p>
            </a>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => onOpenCreate("NEED")}
          className="h-16 rounded-2xl bg-[#BA1A1A] hover:bg-[#9B1414] text-white font-black text-[17px] shadow-md"
        >
          Necesito ayuda
        </button>
        <button
          onClick={() => onOpenCreate("OFFER")}
          className="h-16 rounded-2xl bg-white border-2 border-[#172B2A] text-[#172B2A] hover:bg-gray-50 font-black text-[17px] shadow-sm"
        >
          Ofrezco recursos
        </button>
      </div>

      {status === "loading" && (
        <div className="py-8 flex items-center justify-center gap-2 text-[15px] text-gray-600">
          <div className="size-5 rounded-full border-2 border-[#BA1A1A] border-t-transparent animate-spin" />
          Cargando reportes…
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
          <p className="text-[17px] font-bold text-gray-800">No pudimos cargar los reportes</p>
          <button
            onClick={onRetry}
            className="mx-auto h-12 px-5 rounded-xl border-2 border-[#BA1A1A] text-[#BA1A1A] font-bold text-[15px] flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Reintentar
          </button>
        </div>
      )}

      {overview && (
        <>
          <section className="space-y-3 pt-1" aria-labelledby="reports-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id="reports-title" className="text-xl font-extrabold text-[#172B2A]">
                  Reportes cerca
                </h2>
                {overview.nearbyMeters !== null && (
                  <p className="text-[15px] text-gray-600">
                    A menos de {formatDistance(overview.nearbyMeters)} {place}
                  </p>
                )}
              </div>
              <button onClick={onOpenMap} className="h-11 px-2 text-[15px] font-bold text-[#BA1A1A] hover:underline shrink-0">
                Ver en el mapa
              </button>
            </div>
            {overview.nearbyMeters !== null && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Buscar reportes cerca de">
                <button aria-pressed={origin === "home"} onClick={() => onChooseOrigin("home")} className={originChip(origin === "home")}>
                  <Home className="size-4" />
                  Mi casa
                </button>
                <button
                  aria-pressed={origin === "here"}
                  disabled={locating}
                  onClick={() => onChooseOrigin("here")}
                  className={originChip(origin === "here")}
                >
                  <LocateFixed className={`size-4 ${locating ? "animate-pulse" : ""}`} />
                  {locating ? "Buscando…" : "Donde estoy ahora"}
                </button>
              </div>
            )}
            {locateFailed && (
              <p className="text-[15px] font-semibold text-amber-800" role="alert">
                No pudimos saber dónde estás. Revisa que el GPS esté activo y que hayas dado permiso.
              </p>
            )}
            {error && (
              <p className="text-[15px] font-semibold text-rose-700" role="alert">
                {error}
              </p>
            )}
            {active.length === 0 && (
              <p className="text-[15px] text-gray-600 bg-white rounded-2xl border border-gray-200 p-4">
                No hay reportes abiertos cerca {place}.
              </p>
            )}
            {active.map(rep => (
              <ReportCard key={rep.id} rep={rep} busy={busyId === rep.id} onAction={action => perform(rep, action)} />
            ))}
            {attended.length > 0 && (
              <button
                onClick={() => setShowAttended(v => !v)}
                aria-expanded={showAttended}
                className="h-11 px-1 text-[15px] font-bold text-gray-700 hover:underline"
              >
                {showAttended ? "Ocultar atendidos" : `Ver atendidos (${attended.length})`}
              </button>
            )}
            {showAttended &&
              attended.map(rep => (
                <ReportCard key={rep.id} rep={rep} busy={busyId === rep.id} onAction={action => perform(rep, action)} />
              ))}
          </section>

          <section className="space-y-3 pt-2" aria-labelledby="points-title">
            <h2 id="points-title" className="text-xl font-extrabold text-[#172B2A]">
              Puntos de apoyo
            </h2>
            {overview.supportPoints.length === 0 && (
              <p className="text-[15px] text-gray-600 bg-white rounded-2xl border border-gray-200 p-4">
                La junta todavía no registró puntos de apoyo.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overview.supportPoints.map(point => (
                <SupportPointCard key={point.id} point={point} />
              ))}
            </div>
          </section>
        </>
      )}
      {dialog}
    </div>
  )
}
