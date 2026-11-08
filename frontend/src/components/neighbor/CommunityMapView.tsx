"use client"

import React, { useMemo, useState } from "react"
import { Navigation, X } from "lucide-react"
import { BusinessSummary, EmergencyReport, SupportPoint } from "@/lib/types"
import { formatDistance } from "@/lib/catalog"

interface CommunityMapViewProps {
  center: { lat: number; lng: number }
  businesses: BusinessSummary[]
  reports: EmergencyReport[]
  supportPoints: SupportPoint[]
  onSelectBusiness: (id: number) => void
}

type MapLayer = "negocios" | "emergencias" | "puntos_apoyo"

interface Pin {
  key: string
  layer: MapLayer
  title: string
  subtitle: string
  latitude: number
  longitude: number
  businessId?: number
}

const EXTENT_METERS = 2200

function project(center: { lat: number; lng: number }, lat: number, lng: number): { x: number; y: number } | null {
  const dx = (lng - center.lng) * 111320 * Math.cos((center.lat * Math.PI) / 180)
  const dy = (lat - center.lat) * 110540
  const x = 50 + (dx / EXTENT_METERS) * 50
  const y = 50 - (dy / EXTENT_METERS) * 50
  if (x < 3 || x > 97 || y < 3 || y > 97) return null
  return { x, y }
}

const LAYER_STYLE: Record<MapLayer, { label: string; active: string; dot: string; pin: string }> = {
  negocios: { label: "Negocios", active: "bg-[#087F72] text-white", dot: "bg-emerald-300", pin: "bg-[#087F72]" },
  emergencias: { label: "Emergencias", active: "bg-[#BA1A1A] text-white", dot: "bg-rose-300", pin: "bg-[#BA1A1A]" },
  puntos_apoyo: { label: "Puntos de apoyo", active: "bg-blue-600 text-white", dot: "bg-blue-300", pin: "bg-blue-600" },
}

export const CommunityMapView: React.FC<CommunityMapViewProps> = ({
  center,
  businesses,
  reports,
  supportPoints,
  onSelectBusiness,
}) => {
  const [activeLayers, setActiveLayers] = useState<Record<MapLayer, boolean>>({
    negocios: true,
    emergencias: true,
    puntos_apoyo: true,
  })
  const [selected, setSelected] = useState<Pin | null>(null)

  const pins = useMemo<Pin[]>(
    () => [
      ...businesses.map(b => ({
        key: `b-${b.id}`,
        layer: "negocios" as const,
        title: b.name,
        subtitle: `${b.categoryName} · ${formatDistance(b.distanceMeters)} · ${b.scheduleText}`,
        latitude: b.latitude,
        longitude: b.longitude,
        businessId: b.id,
      })),
      ...reports
        .filter(r => r.status !== "ATTENDED")
        .map(r => ({
          key: `r-${r.id}`,
          layer: "emergencias" as const,
          title: r.title,
          subtitle: `${r.statusLabel} · ${r.categoryLabel} · ${formatDistance(r.distanceMeters)}`,
          latitude: r.latitude,
          longitude: r.longitude,
        })),
      ...supportPoints.map(p => ({
        key: `p-${p.id}`,
        layer: "puntos_apoyo" as const,
        title: p.name,
        subtitle: `${p.typeLabel} · ${formatDistance(p.distanceMeters)} · ${p.open ? "Abierto" : "Cerrado"}`,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
    ],
    [businesses, reports, supportPoints]
  )

  const directionsUrl = (pin: Pin) =>
    `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}&travelmode=walking`

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(LAYER_STYLE) as MapLayer[]).map(layer => (
          <button
            key={layer}
            onClick={() => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
            aria-pressed={activeLayers[layer]}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              activeLayers[layer] ? LAYER_STYLE[layer].active : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            <span className={`size-2 rounded-full ${LAYER_STYLE[layer].dot}`} />
            {LAYER_STYLE[layer].label}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[460px] sm:h-[520px] rounded-3xl bg-[#E8EFE9] border border-gray-200 overflow-hidden shadow-sm">
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" aria-hidden="true">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#FFFFFF" strokeWidth="6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ left: "50%", top: "50%" }}>
          <div className="size-8 rounded-full bg-blue-500/20 animate-ping" />
          <div className="absolute inset-0 m-auto size-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
        </div>

        {pins
          .filter(pin => activeLayers[pin.layer])
          .map(pin => {
            const pos = project(center, pin.latitude, pin.longitude)
            if (!pos) return null
            return (
              <button
                key={pin.key}
                onClick={() => setSelected(pin)}
                aria-label={pin.title}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform ${
                  selected?.key === pin.key ? "scale-125 z-30" : "hover:scale-110"
                }`}
              >
                <div className={`size-7 rounded-full border-2 border-white shadow-md flex items-center justify-center ${LAYER_STYLE[pin.layer].pin}`}>
                  <div className="size-2 rounded-full bg-white" />
                </div>
              </button>
            )
          })}

        <p className="absolute top-3 right-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-gray-600 shadow-sm">
          Lugares a unos 2 km de tu casa
        </p>

        {selected && (
          <div className="absolute bottom-4 left-4 right-4 z-40 bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-gray-100 max-w-lg mx-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-[#172B2A] leading-tight">{selected.title}</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{selected.subtitle}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className={`grid gap-3 pt-3 ${selected.businessId ? "grid-cols-2" : "grid-cols-1"}`}>
              {selected.businessId && (
                <button
                  onClick={() => onSelectBusiness(selected.businessId!)}
                  className="h-10 rounded-xl bg-[#087F72] text-white font-bold text-xs flex items-center justify-center hover:bg-[#075E54]"
                >
                  Ver ficha
                </button>
              )}
              <a
                href={directionsUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 rounded-xl bg-white border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EAF5F1]"
              >
                <Navigation className="size-3.5" />
                Cómo llegar
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
