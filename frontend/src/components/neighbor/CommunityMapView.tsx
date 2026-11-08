// src/components/neighbor/CommunityMapView.tsx
// Pantalla 5 del Figma: Mapa Comunitario Interactivo
"use client"

import React, { useState } from "react"
import { Search, MapPin, Store, Heart, ShieldAlert, Navigation, ChevronRight, X } from "lucide-react"
import { BusinessItem, FavorItem, SupportPointItem } from "@/lib/types"

interface CommunityMapViewProps {
  businesses: BusinessItem[]
  favors: FavorItem[]
  supportPoints: SupportPointItem[]
  onSelectBusiness: (business: BusinessItem) => void
}

type MapLayer = "negocios" | "favores" | "puntos_apoyo"

export const CommunityMapView: React.FC<CommunityMapViewProps> = ({
  businesses,
  favors,
  supportPoints,
  onSelectBusiness,
}) => {
  const [activeLayers, setActiveLayers] = useState<Record<MapLayer, boolean>>({
    negocios: true,
    favores: true,
    puntos_apoyo: true,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPoint, setSelectedPoint] = useState<{
    id: string
    title: string
    subtitle: string
    layer: MapLayer
    rawItem: any
  } | null>(() => {
    // Por defecto inicia mostrando la tarjeta de Don Lucho como en el Figma
    const biz = businesses[0]
    return biz
      ? {
          id: biz.id,
          title: biz.name,
          subtitle: `${biz.category} · ${biz.distanceText} · Recomendado por ${biz.recommendationsCount} vecinos`,
          layer: "negocios",
          rawItem: biz,
        }
      : null
  })

  const toggleLayer = (layer: MapLayer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* ================= BUSCADOR SUPERIOR EN EL MAPA (Figma) ================= */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar en el mapa"
          className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white border border-gray-200 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 shadow-2xs"
        />
      </div>

      {/* ================= FILTROS DE CAPAS (Figma: Negocios | Favores | Puntos de apoyo) ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => toggleLayer("negocios")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
            activeLayers.negocios
              ? "bg-[#087F72] text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          <span className="size-2 rounded-full bg-emerald-300" />
          <span>Negocios</span>
        </button>

        <button
          onClick={() => toggleLayer("favores")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
            activeLayers.favores
              ? "bg-[#F2A900] text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          <span className="size-2 rounded-full bg-amber-200" />
          <span>Favores</span>
        </button>

        <button
          onClick={() => toggleLayer("puntos_apoyo")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
            activeLayers.puntos_apoyo
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          <span className="size-2 rounded-full bg-blue-300" />
          <span>Puntos de apoyo</span>
        </button>
      </div>

      {/* ================= CONTENEDOR DEL MAPA (Figma: Cuadrícula urbana estilizada) ================= */}
      <div className="relative w-full h-[460px] sm:h-[520px] rounded-3xl bg-[#E8EFE9] border border-gray-200 overflow-hidden shadow-sm">
        {/* Trazo de calles en cuadrícula urbana y avenidas diagonales (inspirado en el mapa de Figma) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#FFFFFF" strokeWidth="6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Parque verde */}
          <rect x="60%" y="40%" width="25%" height="22%" rx="12" fill="#D3E7D3" />
          {/* Avenida diagonal blanca principal */}
          <line x1="0%" y1="90%" x2="100%" y2="25%" stroke="#FFFFFF" strokeWidth="12" />
        </svg>

        {/* Pin: Mi Ubicación (Punto azul con radio suave) */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ left: "50%", top: "45%" }}
        >
          <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-ping" />
          <div className="absolute inset-0 m-auto size-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
        </div>

        {/* Pines: Negocios (Círculos verde petróleo con centro blanco, como en Figma) */}
        {activeLayers.negocios &&
          businesses.map(biz => (
            <button
              key={biz.id}
              onClick={() =>
                setSelectedPoint({
                  id: biz.id,
                  title: biz.name,
                  subtitle: `${biz.category} · ${biz.distanceText} · Recomendado por ${biz.recommendationsCount} vecinos`,
                  layer: "negocios",
                  rawItem: biz,
                })
              }
              style={{ left: `${biz.coords.x}%`, top: `${biz.coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                selectedPoint?.id === biz.id ? "scale-125 z-30" : "hover:scale-110"
              }`}
            >
              <div className="size-7 rounded-full bg-[#087F72] border-2 border-white shadow-md flex items-center justify-center">
                <div className="size-2 rounded-full bg-white" />
              </div>
            </button>
          ))}

        {/* Pines: Favores (Círculos dorados/naranjas con centro blanco, como en Figma) */}
        {activeLayers.favores &&
          favors
            .filter(f => f.coords)
            .map(fav => (
              <button
                key={fav.id}
                onClick={() =>
                  setSelectedPoint({
                    id: fav.id,
                    title: fav.title,
                    subtitle: `${fav.author} · ${fav.distanceText} · ${fav.timeAgo}`,
                    layer: "favores",
                    rawItem: fav,
                  })
                }
                style={{ left: `${fav.coords!.x}%`, top: `${fav.coords!.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                  selectedPoint?.id === fav.id ? "scale-125 z-30" : "hover:scale-110"
                }`}
              >
                <div className="size-7 rounded-full bg-[#D97706] border-2 border-white shadow-md flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              </button>
            ))}

        {/* Pines: Puntos de apoyo (Círculos azules con centro blanco) */}
        {activeLayers.puntos_apoyo &&
          supportPoints.map(point => (
            <button
              key={point.id}
              onClick={() =>
                setSelectedPoint({
                  id: point.id,
                  title: point.name,
                  subtitle: `${point.type.toUpperCase()} · ${point.distanceText} · ${point.isOpen ? "Abierto" : "Cerrado"}`,
                  layer: "puntos_apoyo",
                  rawItem: point,
                })
              }
              style={{ left: `${point.coords.x}%`, top: `${point.coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                selectedPoint?.id === point.id ? "scale-125 z-30" : "hover:scale-110"
              }`}
            >
              <div className="size-7 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                <div className="size-2 rounded-full bg-white" />
              </div>
            </button>
          ))}

        {/* ================= TARJETA FLOTANTE INFERIOR AL SELECCIONAR PIN (Figma) ================= */}
        {selectedPoint && (
          <div className="absolute bottom-4 left-4 right-4 z-40 bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-gray-100 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-[#172B2A] leading-tight">
                  {selectedPoint.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {selectedPoint.subtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Botones: "Ver ficha" y "Cómo llegar" (Figma) */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              {selectedPoint.layer === "negocios" ? (
                <button
                  onClick={() => onSelectBusiness(selectedPoint.rawItem)}
                  className="h-10 rounded-xl bg-[#087F72] text-white font-bold text-xs flex items-center justify-center hover:bg-[#075E54] active:scale-98 transition-all shadow-xs"
                >
                  Ver ficha
                </button>
              ) : (
                <button
                  onClick={() => alert(`Detalle de ${selectedPoint.title}`)}
                  className="h-10 rounded-xl bg-[#087F72] text-white font-bold text-xs flex items-center justify-center hover:bg-[#075E54] active:scale-98 transition-all shadow-xs"
                >
                  Ver detalle
                </button>
              )}

              <button
                onClick={() =>
                  alert(`Iniciando navegación guiada a ${selectedPoint.title}...`)
                }
                className="h-10 rounded-xl bg-white border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EAF5F1] active:scale-98 transition-all shadow-xs"
              >
                <Navigation className="size-3.5" />
                <span>Cómo llegar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

