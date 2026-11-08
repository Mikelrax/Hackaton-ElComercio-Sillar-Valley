// src/components/neighbor/EmergencySOSView.tsx
// Pantalla 6 del Figma: Modo Emergencia SOS
"use client"

import React, { useState } from "react"
import { AlertTriangle, WifiOff, PhoneCall, Check, MapPin, ShieldAlert, HeartPulse } from "lucide-react"
import { EmergencyReportItem, SupportPointItem } from "@/lib/types"

interface EmergencySOSViewProps {
  reports: EmergencyReportItem[]
  supportPoints: SupportPointItem[]
  onOpenCreate: (initialType?: "emergencia") => void
  onOpenMap: () => void
}

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({
  reports,
  supportPoints,
  onOpenCreate,
  onOpenMap,
}) => {
  const [reportList, setReportList] = useState(reports)
  const [offlineNotice, setOfflineNotice] = useState(true)

  // Cambio de estado al hacer clic en "Voy en camino"
  const handleAction = (reportId: string) => {
    setReportList(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          if (r.status === "urgente") {
            return { ...r, status: "en_camino" as const, statusText: "En camino" }
          }
          if (r.status === "en_camino") {
            return { ...r, status: "atendido" as const, statusText: "Atendido" }
          }
        }
        return r
      })
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* ================= BANNER ROJO SUPERIOR: MODO EMERGENCIA SISMO (Figma) ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#BA1A1A] text-white shadow-md space-y-1">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="size-6 text-white shrink-0 animate-bounce" />
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight">
              Modo emergencia: sismo
            </h1>
            <p className="text-xs text-rose-100 font-medium">
              Activado por la junta vecinal · hace 20 min
            </p>
          </div>
        </div>
      </div>

      {/* ================= BANNER SIN CONEXIÓN RESILIENTE (Figma: Borde punteado) ================= */}
      {offlineNotice && (
        <div className="p-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-between text-xs text-gray-600 font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <WifiOff className="size-4 text-gray-500 shrink-0" />
            <span>Sin señal: tus reportes se enviarán al reconectar</span>
          </div>
          <button
            onClick={() => setOfflineNotice(false)}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700"
          >
            Entendido
          </button>
        </div>
      )}

      {/* ================= BOTONES GRANDES DE ACCIÓN: NECESITO AYUDA / OFREZCO RECURSOS (Figma) ================= */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => onOpenCreate("emergencia")}
          className="h-14 sm:h-16 rounded-2xl bg-[#BA1A1A] hover:bg-[#9B1414] active:scale-98 text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center transition-all"
        >
          Necesito ayuda
        </button>
        <button
          onClick={() => onOpenCreate("emergencia")}
          className="h-14 sm:h-16 rounded-2xl bg-white border-2 border-[#172B2A] text-[#172B2A] hover:bg-gray-50 active:scale-98 font-black text-sm sm:text-base shadow-sm flex items-center justify-center transition-all"
        >
          Ofrezco recursos
        </button>
      </div>

      {/* ================= REPORTES CERCA (Figma) ================= */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#172B2A]">Reportes cerca</h2>
          <button
            onClick={onOpenMap}
            className="text-xs font-bold text-[#BA1A1A] hover:underline"
          >
            Ver en el mapa
          </button>
        </div>

        <div className="space-y-3">
          {reportList.map(rep => {
            const isUrgente = rep.status === "urgente"
            const isEnCamino = rep.status === "en_camino"
            const isAtendido = rep.status === "atendido"

            return (
              <div
                key={rep.id}
                className={`p-4 rounded-2xl bg-white border shadow-2xs flex items-center justify-between gap-3 transition-all ${
                  isUrgente
                    ? "border-rose-300 ring-1 ring-rose-100"
                    : "border-gray-200/90"
                }`}
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#172B2A]">{rep.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {rep.severity === "alta" ? "Urgente" : "Prioritario"} · a {rep.distanceText} · {rep.timeAgo}
                  </p>
                </div>

                {/* Botón de respuesta vecinal (Figma: Rojo para Voy en camino, Amarillo para En camino, Verde para Atendido) */}
                <button
                  onClick={() => handleAction(rep.id)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-extrabold shrink-0 transition-all active:scale-95 shadow-2xs ${
                    isUrgente
                      ? "bg-[#BA1A1A] text-white hover:bg-[#991515]"
                      : isEnCamino
                      ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                  }`}
                >
                  {rep.statusText}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= PUNTOS DE APOYO (Figma) ================= */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-[#172B2A]">Puntos de apoyo</h2>

        <div className="space-y-2.5">
          {supportPoints.map(point => (
            <div
              key={point.id}
              className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="size-3.5 rounded-sm bg-blue-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                  {point.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium shrink-0">
                {point.distanceText} · {point.isOpen ? "Abierto" : "Cerrado"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TELÉFONOS DE AUXILIO RÁPIDO (Figma: Tarjetas rosadas 105, 116, 106) ================= */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <a
          href="tel:105"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center hover:bg-rose-100 transition-all shadow-2xs"
        >
          <p className="text-base sm:text-lg font-black text-[#BA1A1A]">105</p>
          <p className="text-[11px] font-bold text-rose-900 mt-0.5">Policía</p>
        </a>

        <a
          href="tel:116"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center hover:bg-rose-100 transition-all shadow-2xs"
        >
          <p className="text-base sm:text-lg font-black text-[#BA1A1A]">116</p>
          <p className="text-[11px] font-bold text-rose-900 mt-0.5">Bomberos</p>
        </a>

        <a
          href="tel:106"
          className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center hover:bg-rose-100 transition-all shadow-2xs"
        >
          <p className="text-base sm:text-lg font-black text-[#BA1A1A]">106</p>
          <p className="text-[11px] font-bold text-rose-900 mt-0.5">SAMU</p>
        </a>
      </div>
    </div>
  )
}

