"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, MapPin, RefreshCw, Search, SlidersHorizontal, Store, ThumbsUp, X } from "lucide-react"
import { BusinessSearchResult, DirectoryOptions } from "@/lib/types"
import { businessesApi } from "@/lib/businesses"
import { formatDistance } from "@/lib/catalog"
import { CategoryIcon, categoryTone } from "@/components/ui/category-icon"

interface DirectoryViewProps {
  userName: string
  userNeighborhood: string
  location: { lat: number; lng: number }
  options: DirectoryOptions
  refreshKey: number
  onSelectBusiness: (id: number) => void
  onOpenMap: () => void
  onRecommendNew: () => void
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  userName,
  userNeighborhood,
  location,
  options,
  refreshKey,
  onSelectBusiness,
  onOpenMap,
  onRecommendNew,
}) => {
  const defaultRadius = options.defaultRadius
  const defaultSort = options.sorts[0]?.value ?? ""
  const radiusLabel = (meters: number | null) => options.radii.find(o => o.meters === meters)?.label ?? ""
  const sortLabel = (value: string) => options.sorts.find(o => o.value === value)?.label ?? value
  const [searchTerm, setSearchTerm] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  const [radius, setRadius] = useState<number | null>(defaultRadius)
  const [openNow, setOpenNow] = useState(false)
  const [sort, setSort] = useState(defaultSort)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [result, setResult] = useState<BusinessSearchResult | null>(null)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchTerm), 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    businessesApi
      .search({ q: query, category, radius, openNow, sort, lat: location.lat, lng: location.lng })
      .then(data => {
        if (cancelled) return
        setResult(data)
        setError(false)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, category, radius, openNow, sort, location.lat, location.lng, reloadKey, refreshKey])

  const facets = useMemo(() => result?.categories ?? [], [result])
  const totalAllCategories = facets.reduce((n, f) => n + f.count, 0)
  const visibleFacets = facets.filter(f => f.count > 0 || f.slug === category)
  const activeFilterCount = (radius !== defaultRadius ? 1 : 0) + (openNow ? 1 : 0) + (sort !== defaultSort ? 1 : 0)
  const firstName = userName.split(" ")[0] || userName

  const update = (fn: () => void) => {
    setLoading(true)
    fn()
  }

  const clearFilters = () =>
    update(() => {
      setRadius(defaultRadius)
      setOpenNow(false)
      setSort(defaultSort)
      setCategory(null)
      setSearchTerm("")
    })

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172B2A] tracking-tight">Hola, {firstName}</h1>
          <p className="text-sm text-gray-500 font-medium">¿Qué necesitas hoy cerca de casa?</p>
        </div>
        <Link
          href="/direcciones"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-gray-200 text-xs font-bold text-[#172B2A] hover:border-[#087F72]"
        >
          <MapPin className="size-3.5 text-[#087F72]" />
          {userNeighborhood}
          <span className="font-semibold text-[#087F72]">· Cambiar</span>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={e => {
              setLoading(true)
              setSearchTerm(e.target.value)
            }}
            placeholder="Gasfitero, menú, costura…"
            aria-label="Buscar negocios y servicios"
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#087F72]/30 shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => update(() => setSearchTerm(""))}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="relative h-12 px-4 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-[#172B2A] flex items-center gap-2 hover:border-[#087F72] shadow-2xs"
        >
          <SlidersHorizontal className="size-4 text-[#087F72]" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-[#087F72] text-white text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="list" aria-label="Categorías">
        <button
          role="listitem"
          onClick={() => update(() => setCategory(null))}
          className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            category === null ? "bg-[#087F72] text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
          }`}
        >
          Todas
          <span className={category === null ? "text-white/80" : "text-gray-400"}>{totalAllCategories}</span>
        </button>
        {visibleFacets.map(f => {
          const selected = category === f.slug
          return (
            <button
              role="listitem"
              key={f.slug}
              onClick={() => update(() => setCategory(selected ? null : f.slug))}
              className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                selected ? "bg-[#087F72] text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <CategoryIcon name={f.icon} className="size-3.5" />
              {f.name}
              <span className={selected ? "text-white/80" : "text-gray-400"}>{f.count}</span>
            </button>
          )
        })}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {radius !== defaultRadius && (
            <button
              onClick={() => update(() => setRadius(defaultRadius))}
              className="h-8 px-3 rounded-full bg-[#EAF5F1] text-[#087F72] text-xs font-bold flex items-center gap-1"
            >
              {radius === null ? radiusLabel(null) : `A ${radiusLabel(radius)}`}
              <X className="size-3.5" />
            </button>
          )}
          {openNow && (
            <button
              onClick={() => update(() => setOpenNow(false))}
              className="h-8 px-3 rounded-full bg-[#EAF5F1] text-[#087F72] text-xs font-bold flex items-center gap-1"
            >
              Abierto ahora
              <X className="size-3.5" />
            </button>
          )}
          {sort !== defaultSort && (
            <button
              onClick={() => update(() => setSort(defaultSort))}
              className="h-8 px-3 rounded-full bg-[#EAF5F1] text-[#087F72] text-xs font-bold flex items-center gap-1"
            >
              {sortLabel(sort)}
              <X className="size-3.5" />
            </button>
          )}
          <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-gray-800 underline">
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#172B2A]">
            {result ? `${result.totalElements} ${result.totalElements === 1 ? "lugar" : "lugares"}` : "Buscando…"}
            {radius !== null && <span className="font-medium text-gray-500"> a menos de {radiusLabel(radius)}</span>}
          </h2>
          <button onClick={onOpenMap} className="text-xs font-bold text-[#087F72] hover:underline">
            Ver en el mapa
          </button>
        </div>

        {error && (
          <div className="py-10 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-3">
            <p className="text-sm font-bold text-gray-700">No pudimos cargar los negocios</p>
            <button
              onClick={() => update(() => setReloadKey(k => k + 1))}
              className="mx-auto h-9 px-4 rounded-xl border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {result?.content.map(biz => (
              <button
                key={biz.id}
                onClick={() => onSelectBusiness(biz.id)}
                className="text-left p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-[#087F72]/50 transition-all flex gap-3.5"
              >
                <span className={`size-12 shrink-0 rounded-2xl flex items-center justify-center ${categoryTone(biz.categorySlug)}`}>
                  <CategoryIcon name={biz.categoryIcon} className="size-6" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-sm font-extrabold text-[#172B2A] truncate">{biz.name}</span>
                  <span className="block text-[11px] text-gray-500 font-medium">
                    {biz.categoryName}
                    {biz.distanceMeters !== null && ` · ${formatDistance(biz.distanceMeters)}`}
                    {" · "}
                    <span className={biz.openNow ? "text-emerald-700 font-bold" : ""}>{biz.scheduleText}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#087F72]">
                    <ThumbsUp className="size-3.5 shrink-0" />
                    {biz.recommendationsCount === 1
                      ? "Recomendado por 1 vecino"
                      : `Recomendado por ${biz.recommendationsCount} vecinos`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {!error && result && result.totalElements === 0 && (
          <div className="py-10 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-3">
            <Store className="size-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No encontramos lugares con esos filtros</p>
            <p className="text-xs text-gray-500">Prueba con otra palabra, otra categoría o una distancia mayor.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={clearFilters}
                className="h-9 px-4 rounded-xl border border-[#087F72] text-[#087F72] font-bold text-xs"
              >
                Quitar filtros
              </button>
              <button
                onClick={onRecommendNew}
                className="h-9 px-4 rounded-xl bg-[#087F72] text-white font-bold text-xs"
              >
                Recomendar un negocio
              </button>
            </div>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#172B2A]">Filtros</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar filtros"
                className="size-9 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold text-[#172B2A] mb-2">Qué tan cerca</legend>
              <div className="grid grid-cols-2 gap-2">
                {options.radii.map(o => (
                  <button
                    key={o.label}
                    onClick={() => update(() => setRadius(o.meters))}
                    aria-pressed={radius === o.meters}
                    className={`h-11 rounded-xl border-2 text-sm font-bold transition-colors ${
                      radius === o.meters
                        ? "border-[#087F72] bg-[#EAF5F1] text-[#087F72]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span>
                <span className="block text-sm font-bold text-[#172B2A]">Solo abiertos ahora</span>
                <span className="block text-xs text-gray-500">Según el horario que indicó cada negocio</span>
              </span>
              <input
                type="checkbox"
                checked={openNow}
                onChange={e => update(() => setOpenNow(e.target.checked))}
                className="size-6 accent-[#087F72] cursor-pointer"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold text-[#172B2A] mb-2">Ordenar por</legend>
              <div className="grid grid-cols-2 gap-2">
                {options.sorts.map(o => (
                  <button
                    key={o.value}
                    onClick={() => update(() => setSort(o.value))}
                    aria-pressed={sort === o.value}
                    className={`h-11 rounded-xl border-2 text-sm font-bold transition-colors ${
                      sort === o.value
                        ? "border-[#087F72] bg-[#EAF5F1] text-[#087F72]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={clearFilters}
                className="h-12 rounded-xl border border-gray-300 text-sm font-bold text-gray-700"
              >
                Limpiar
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="h-12 rounded-xl bg-[#087F72] text-white text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <Check className="size-4" />
                Ver {result?.totalElements ?? 0} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
