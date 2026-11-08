"use client"

import React, { useState, useSyncExternalStore } from "react"
import { AlertTriangle, BadgeCheck, Phone, RefreshCw, ShieldCheck, WifiOff } from "lucide-react"
import { EmergencyOverview, EmergencyReport, Option } from "@/lib/types"
import { ApiError } from "@/lib/api"
import { emergencyApi } from "@/lib/emergency"
import { formatDistance } from "@/lib/catalog"
import { timeAgo } from "@/lib/posts"

interface EmergencySOSViewProps {
  overview: EmergencyOverview | null
  status: "loading" | "ready" | "error"
  emergencyNumbers: Option[]
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

const SEVERITY_STYLE: Record<EmergencyReport["severity"], string> = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-gray-100 text-gray-600",
}

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({
  overview,
  status,
  emergencyNumbers,
  onRetry,
  onChanged,
  onOpenCreate,
  onOpenMap,
}) => {
  const online = useOnline()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const act = async (id: number, action: () => Promise<unknown>) => {
    setBusyId(id)
    setError("")
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : "No pudimos guardar el cambio.")
    } finally {
      setBusyId(null)
    }
  }

  const mode = overview?.mode

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {mode?.active ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#BA1A1A] text-white shadow-md space-y-1">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-6 text-white shrink-0" />
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">Modo emergencia: {mode.title}</h1>
              <p className="text-xs text-rose-100 font-medium">
                Activado por {mode.activatedBy} de la junta vecinal · {mode.activatedAt && timeAgo(mode.activatedAt)}
              </p>
              {mode.message && <p className="text-sm mt-1.5">{mode.message}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-3">
          <ShieldCheck className="size-6 text-[#087F72] shrink-0" />
          <div>
            <h1 className="text-base font-black text-[#172B2A]">No hay una emergencia activa</h1>
            <p className="text-xs text-gray-500 font-medium">
              Si alguien necesita ayuda urgente, avísalo aquí y tus vecinos lo verán.
            </p>
          </div>
        </div>
      )}

      {!online && (
        <div className="p-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-center gap-2 text-xs text-gray-600 font-medium">
          <WifiOff className="size-4 text-gray-500 shrink-0" />
          Sin conexión: si avisas una emergencia la guardamos y se envía sola cuando vuelva la señal. Si es urgente, llama a los números de emergencia.
        </div>
      )}

      {emergencyNumbers.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5" aria-label="Números de emergencia">
          {emergencyNumbers.map(n => (
            <a
              key={n.value}
              href={`tel:${n.value}`}
              className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center hover:bg-rose-100"
            >
              <p className="text-base sm:text-lg font-black text-[#BA1A1A] flex items-center justify-center gap-1.5">
                <Phone className="size-4" />
                {n.value}
              </p>
              <p className="text-[11px] font-bold text-rose-900 mt-0.5">{n.label}</p>
            </a>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => onOpenCreate("NEED")}
          className="h-14 sm:h-16 rounded-2xl bg-[#BA1A1A] hover:bg-[#9B1414] text-white font-black text-sm sm:text-base shadow-md"
        >
          Necesito ayuda
        </button>
        <button
          onClick={() => onOpenCreate("OFFER")}
          className="h-14 sm:h-16 rounded-2xl bg-white border-2 border-[#172B2A] text-[#172B2A] hover:bg-gray-50 font-black text-sm sm:text-base shadow-sm"
        >
          Ofrezco recursos
        </button>
      </div>

      {status === "loading" && (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="size-5 rounded-full border-2 border-[#BA1A1A] border-t-transparent animate-spin" />
          Cargando reportes…
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
          <p className="text-sm font-bold text-gray-700">No pudimos cargar los reportes</p>
          <button
            onClick={onRetry}
            className="mx-auto h-9 px-4 rounded-xl border border-[#BA1A1A] text-[#BA1A1A] font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {overview && (
        <>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#172B2A]">Reportes cerca</h2>
              <button onClick={onOpenMap} className="text-xs font-bold text-[#BA1A1A] hover:underline">
                Ver en el mapa
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
            {overview.reports.length === 0 && (
              <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-4">No hay reportes por ahora.</p>
            )}
            {overview.reports.map(rep => {
              const busy = busyId === rep.id
              return (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-2 ${
                    rep.status === "URGENT" ? "border-rose-300 ring-1 ring-rose-100" : "border-gray-200/90"
                  } ${rep.status === "ATTENDED" ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#172B2A] flex items-center gap-1.5">
                        {rep.title}
                        {rep.verified && <BadgeCheck className="size-4 text-[#087F72]" aria-label="Verificado por la junta" />}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {rep.kind === "OFFER" ? "Ofrece" : `${rep.peopleCount} ${rep.peopleCount === 1 ? "persona" : "personas"}`} ·{" "}
                        {rep.categoryLabel}
                        {rep.distanceMeters !== null && ` · a ${formatDistance(rep.distanceMeters)}`} · {timeAgo(rep.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${SEVERITY_STYLE[rep.severity]}`}>
                      {rep.kind === "OFFER" ? "Recurso" : rep.severityLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {rep.status === "URGENT" && !rep.mine && (
                      <button
                        disabled={busy}
                        onClick={() => act(rep.id, () => emergencyApi.onTheWay(rep.id))}
                        className="h-9 px-3.5 rounded-xl bg-[#BA1A1A] text-white text-xs font-extrabold hover:bg-[#991515] disabled:opacity-60"
                      >
                        {busy ? "Avisando…" : "Voy en camino"}
                      </button>
                    )}
                    {rep.status === "URGENT" && rep.mine && (
                      <span className="text-xs font-bold text-rose-700">Esperando que alguien responda</span>
                    )}
                    {rep.status === "ON_THE_WAY" && (
                      <span className="h-9 px-3 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center">
                        {rep.helper ? `${rep.helper} va en camino` : rep.statusLabel}
                      </span>
                    )}
                    {rep.status !== "ATTENDED" && (rep.mine || rep.helpingByMe) && (
                      <button
                        disabled={busy}
                        onClick={() => act(rep.id, () => emergencyApi.attended(rep.id))}
                        className="h-9 px-3.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold disabled:opacity-60"
                      >
                        Ya está atendido
                      </button>
                    )}
                    {rep.status === "ATTENDED" && (
                      <span className="h-9 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center">
                        Atendido
                      </span>
                    )}
                    {rep.reporterPhone && !rep.mine && rep.status !== "ATTENDED" && (
                      <a
                        href={`tel:+${rep.reporterPhone}`}
                        className="h-9 px-3.5 rounded-xl border border-[#172B2A] text-[#172B2A] text-xs font-bold flex items-center gap-1.5"
                      >
                        <Phone className="size-3.5" />
                        Llamar a {rep.reporter}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="text-base font-extrabold text-[#172B2A]">Puntos de apoyo</h2>
            {overview.supportPoints.length === 0 && (
              <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-4">
                La junta todavía no registró puntos de apoyo.
              </p>
            )}
            {overview.supportPoints.map(point => (
              <div
                key={point.id}
                className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`size-3 rounded-sm shrink-0 ${point.open ? "bg-blue-600" : "bg-gray-300"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{point.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {point.typeLabel}
                      {point.address && ` · ${point.address}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium shrink-0">
                  {[formatDistance(point.distanceMeters), point.open ? "Abierto" : "Cerrado"].filter(Boolean).join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
