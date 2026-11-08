"use client"

import React, { useState, useMemo } from "react"
import { Search, MapPin, ThumbsUp } from "lucide-react"
import { BusinessItem } from "@/lib/types"

interface DirectoryViewProps {
  userName: string
  userNeighborhood: string
  businesses: BusinessItem[]
  onSelectBusiness: (business: BusinessItem) => void
  onOpenMap: () => void
  activeRadius: string
  onChangeRadius: (radius: string) => void
}

const CATEGORIES = ["Todos", "Comida casera", "Gasfitería", "Bodega", "Costura", "Técnico"]

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  userName,
  userNeighborhood,
  businesses,
  onSelectBusiness,
  onOpenMap,
  activeRadius,
  onChangeRadius,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === "Todos" || b.category.toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [businesses, searchTerm, selectedCategory])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172B2A] tracking-tight">
            Hola, {userName.split(" ")[0] || "Vecino"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            ¿Qué necesitas hoy cerca de casa?
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-gray-200 shadow-2xs px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700">
          <MapPin className="size-3.5 text-[#087F72]" />
          <span>{userNeighborhood}</span>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1">
            {["500m", "1km", "2km"].map(r => (
              <button
                key={r}
                onClick={() => onChangeRadius(r)}
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  activeRadius === r
                    ? "bg-[#087F72] text-white"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Gasfitero, bodega, costura..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-gray-200/90 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 focus:border-[#087F72] shadow-2xs transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full size-5 flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                isSelected
                  ? "bg-[#087F72] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#172B2A]">Recomendados cerca de ti</h2>
          <button
            onClick={onOpenMap}
            className="text-xs font-bold text-[#087F72] hover:underline flex items-center gap-1"
          >
            Ver en el mapa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBusinesses.map(biz => (
            <div
              key={biz.id}
              onClick={() => onSelectBusiness(biz)}
              className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#087F72]/40 transition-all cursor-pointer flex items-center gap-3.5 group"
            >
              <div
                className={`size-13 rounded-2xl ${biz.colorBg} ${biz.colorText} flex items-center justify-center text-lg font-black shrink-0 transition-transform group-hover:scale-105`}
              >
                {biz.initial}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <h3 className="text-sm font-bold text-[#172B2A] truncate group-hover:text-[#087F72] transition-colors">
                  {biz.name}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  {biz.category} · {biz.distanceText} · {biz.isOpen ? "Abierto" : "Cerrado"}
                </p>

                <div className="pt-1 flex items-center gap-1.5 text-xs font-bold text-[#087F72]">
                  <ThumbsUp className="size-3.5 shrink-0" />
                  <span className="truncate">Recomendado por {biz.recommendationsCount} vecinos</span>
                </div>
              </div>
            </div>
          ))}

          {filteredBusinesses.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-2">
              <p className="text-sm font-bold text-gray-700">No encontramos negocios en esta categoría</p>
              <p className="text-xs text-gray-400">
                Prueba buscando otro término o sé el primero en recomendar un servicio del barrio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
