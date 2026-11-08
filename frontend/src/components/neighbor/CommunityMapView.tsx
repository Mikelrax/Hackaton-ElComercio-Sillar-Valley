"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  Check,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Address } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { formatDistance } from "@/lib/catalog"
import { currentPosition, directionsUrl, mapApi, metersBetween, type LatLng, type MapFilters } from "@/lib/map"
import { timeAgo } from "@/lib/posts"
import { Catalog, MapItem, MapResult, MapSearchResult, Place } from "@/lib/types"
import { CategoryIcon } from "@/components/ui/category-icon"
import { layerStyle } from "@/components/map/layer-style"
import type { MapFocus } from "@/components/map/NeighborhoodMap"

const NeighborhoodMap = dynamic(() => import("@/components/map/NeighborhoodMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#E8EFE9]" />,
})

interface Origin {
  key: string
  label: string
  icon: string
  point: LatLng
}

interface CommunityMapViewProps {
  catalog: Catalog
  home: LatLng
  addresses: Address[]
  emergencyActive: boolean
  refreshKey: number
  onSelectBusiness: (id: number) => void
  onRespondPost: (item: MapItem) => Promise<void>
  onOnTheWay: (item: MapItem) => Promise<void>
  onOpenEmergency: () => void
}

type View = "mapa" | "lista"

function Chip({
  active,
  onClick,
  children,
  activeClass = "bg-[#087F72] text-white border-[#087F72]",
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeClass?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 h-9 px-3.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-colors ${
        active ? activeClass : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez."
}

export const CommunityMapView: React.FC<CommunityMapViewProps> = ({
  catalog,
  home,
  addresses,
  emergencyActive,
  refreshKey,
  onSelectBusiness,
  onRespondPost,
  onOnTheWay,
  onOpenEmergency,
}) => {
  const options = catalog.map
  const [origin, setOrigin] = useState<Origin>({ key: "primary", label: "Mi casa", icon: "house", point: home })
  const [radius, setRadius] = useState(options.defaultRadius)
  const [layers, setLayers] = useState<string[]>(() =>
    emergencyActive ? options.emergencyLayers : options.layers.map(l => l.value)
  )
  const [filters, setFilters] = useState<MapFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<View>("mapa")
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<{ key: string; data: MapResult } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [selected, setSelected] = useState<MapItem | null>(null)
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [center, setCenter] = useState<LatLng>(home)
  const [gpsError, setGpsError] = useState(false)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState<{ q: string; data: MapSearchResult } | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [doneKeys, setDoneKeys] = useState<string[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requestKey = JSON.stringify({ o: origin.point, radius, layers, filters, reloadKey, refreshKey })

  useEffect(() => {
    let cancelled = false
    mapApi
      .items({ center: origin.point, radius, layers, filters })
      .then(data => {
        if (!cancelled) setResult({ key: requestKey, data })
      })
      .catch(() => {
        if (!cancelled) setFailedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
  }, [origin, radius, layers, filters, requestKey])

  const loading = result?.key !== requestKey && failedKey !== requestKey
  const failed = failedKey === requestKey
  const items = useMemo(() => result?.data.items ?? [], [result])
  const counts = result?.data.counts ?? {}
  const current = selected ? items.find(i => i.key === selected.key) ?? selected : null
  const mapItems = useMemo(
    () => (current && !items.some(i => i.key === current.key) ? [...items, current] : items),
    [items, current]
  )

  const activeFilters = Object.values(filters).filter(Boolean).length
  const movedAway = metersBetween(center, origin.point) > Math.max(250, radius * 0.4)
  const has = (layer: string) => layers.includes(layer)

  const setFilter = <K extends keyof MapFilters>(key: K, value: MapFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }))
  }

  const toggleLayer = (value: string) => {
    setLayers(prev => {
      const next = prev.includes(value) ? prev.filter(l => l !== value) : [...prev, value]
      return next.length === 0 ? prev : options.layers.map(l => l.value).filter(l => next.includes(l))
    })
  }

  const chooseOrigin = (next: Origin) => {
    setOrigin(next)
    setCenter(next.point)
    setSelected(null)
  }

  const locateMe = () => {
    setGpsError(false)
    setLocating(true)
    currentPosition()
      .then(point => chooseOrigin({ key: "gps", label: "Donde estoy ahora", icon: "locate-fixed", point }))
      .catch(() => setGpsError(true))
      .finally(() => setLocating(false))
  }

  const handleQuery = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const q = value.trim()
    if (q.length < 3) return
    searchTimer.current = setTimeout(() => {
      mapApi
        .search(q, origin.point)
        .then(data => setSearch({ q, data }))
        .catch(() => setSearch({ q, data: { items: [], places: [] } }))
    }, 400)
  }

  const clearSearch = () => {
    setQuery("")
    setSearch(null)
  }

  const showItem = (item: MapItem) => {
    setSelected(item)
    setView("mapa")
    setFocus(prev => ({ point: { lat: item.latitude, lng: item.longitude }, zoom: 17, seq: (prev?.seq ?? 0) + 1 }))
  }

  const choosePlace = (place: Place) => {
    clearSearch()
    chooseOrigin({ key: "place", label: place.name, icon: "map-pin", point: { lat: place.latitude, lng: place.longitude } })
  }

  const runAction = async (item: MapItem, action: () => Promise<void>) => {
    setBusy(true)
    setActionError("")
    try {
      await action()
      setDoneKeys(prev => [...prev, item.key])
      setReloadKey(k => k + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDoneKeys(prev => [...prev, item.key])
      else setActionError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const searchVisible = query.trim().length >= 3
  const searchData = search && search.q === query.trim() ? search.data : null

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#172B2A] tracking-tight">Mapa del barrio</h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
          Negocios, favores, emergencias y puntos de apoyo cerca de ti
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          enterKeyHint="search"
          value={query}
          onChange={e => handleQuery(e.target.value)}
          placeholder="Busca un negocio, un favor o una calle"
          aria-label="Buscar en el mapa"
          className="w-full h-11 rounded-2xl border border-gray-200 bg-white pl-10 pr-10 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#087F72]/30"
        />
        {query && (
          <button type="button" onClick={clearSearch} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X className="size-4" />
          </button>
        )}
        {searchVisible && (
          <div className="absolute z-30 mt-1 w-full rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            {!searchData && <p className="px-4 py-3 text-xs text-gray-500">Buscando…</p>}
            {searchData && searchData.items.length === 0 && searchData.places.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-500">No encontramos nada con «{query.trim()}».</p>
            )}
            {searchData && searchData.items.length > 0 && (
              <div className="py-1">
                <p className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-gray-400">En Ayni</p>
                {searchData.items.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      clearSearch()
                      showItem(item)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className={`size-8 shrink-0 rounded-full flex items-center justify-center ${layerStyle(item.layer).soft}`}>
                      <CategoryIcon name={item.icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#172B2A] truncate">{item.title}</span>
                      <span className="block text-xs text-gray-500 truncate">
                        {[item.subtitle, formatDistance(item.distanceMeters)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchData && searchData.places.length > 0 && (
              <div className="py-1 border-t border-gray-100">
                <p className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wide text-gray-400">Lugares</p>
                {searchData.places.map(place => (
                  <button
                    key={`${place.name}-${place.latitude}-${place.longitude}`}
                    type="button"
                    onClick={() => choosePlace(place)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="size-8 shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <MapPin className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#172B2A] truncate">{place.name}</span>
                      <span className="block text-xs text-gray-500 truncate">
                        {[place.detail, place.neighborhood].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Buscar cerca de</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {addresses.map(a => {
            const active = origin.key === `a-${a.id}` || (origin.key === "primary" && a.primary)
            return (
              <Chip
                key={a.id}
                active={active}
                onClick={() =>
                  chooseOrigin({ key: `a-${a.id}`, label: a.label, icon: a.icon, point: { lat: a.latitude, lng: a.longitude } })
                }
              >
                <CategoryIcon name={a.icon} className="size-3.5" />
                {a.label}
              </Chip>
            )
          })}
          {addresses.length === 0 && (
            <Chip active={origin.key === "primary"} onClick={() => chooseOrigin({ key: "primary", label: "Mi casa", icon: "house", point: home })}>
              <CategoryIcon name="house" className="size-3.5" />
              Mi casa
            </Chip>
          )}
          <Chip active={origin.key === "gps"} onClick={locateMe}>
            <LocateFixed className={`size-3.5 ${locating ? "animate-pulse" : ""}`} />
            {locating ? "Buscando…" : "Donde estoy ahora"}
          </Chip>
          {(origin.key === "place" || origin.key === "zone") && (
            <Chip active onClick={() => undefined}>
              <MapPin className="size-3.5" />
              {origin.label}
            </Chip>
          )}
        </div>
        {gpsError && (
          <p className="text-xs font-semibold text-rose-600">
            No pudimos obtener tu ubicación. Revisa que el GPS esté activo y que hayas dado permiso.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="shrink-0 text-[11px] font-black uppercase tracking-wide text-gray-500">A</span>
        {options.radii.map(r => (
          <Chip key={r.label} active={radius === r.meters} onClick={() => r.meters && setRadius(r.meters)}>
            {r.label}
          </Chip>
        ))}
        <span className="shrink-0 w-px h-6 bg-gray-200 mx-1" />
        {options.layers.map(l => (
          <Chip key={l.value} active={has(l.value)} onClick={() => toggleLayer(l.value)} activeClass={`${layerStyle(l.value).chip} border-transparent`}>
            <CategoryIcon name={l.icon} className="size-3.5" />
            {l.label}
            {has(l.value) && counts[l.value] !== undefined && (
              <span className="ml-0.5 rounded-full bg-white/25 px-1.5 text-[10px]">{counts[l.value]}</span>
            )}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            activeFilters > 0 ? "border-[#087F72] text-[#087F72] bg-[#EAF5F1]" : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {activeFilters > 0 && (
            <span className="rounded-full bg-[#087F72] text-white px-1.5 text-[10px]">{activeFilters}</span>
          )}
        </button>

        <div className="p-1 rounded-xl bg-gray-100 flex items-center">
          <button
            type="button"
            onClick={() => setView("mapa")}
            aria-pressed={view === "mapa"}
            className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              view === "mapa" ? "bg-white text-[#172B2A] shadow-xs" : "text-gray-500"
            }`}
          >
            <MapIcon className="size-3.5" />
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setView("lista")}
            aria-pressed={view === "lista"}
            className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              view === "lista" ? "bg-white text-[#172B2A] shadow-xs" : "text-gray-500"
            }`}
          >
            <List className="size-3.5" />
            Lista
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-2xl bg-white border border-gray-200 p-4 space-y-4 shadow-2xs">
          {has("businesses") && (
            <>
              <FilterGroup title="Negocios y servicios">
                <Chip active={!!filters.openNow} onClick={() => setFilter("openNow", true)}>
                  {filters.openNow && <Check className="size-3.5" />}
                  Abierto ahora
                </Chip>
                <Chip active={!!filters.recommended} onClick={() => setFilter("recommended", true)}>
                  {filters.recommended && <Check className="size-3.5" />}
                  Recomendados por vecinos
                </Chip>
              </FilterGroup>
              <FilterGroup title="Tipo de negocio">
                {catalog.businessCategories.map(c => (
                  <Chip key={c.slug} active={filters.businessCategory === c.slug} onClick={() => setFilter("businessCategory", c.slug)}>
                    <CategoryIcon name={c.icon} className="size-3.5" />
                    {c.name}
                  </Chip>
                ))}
              </FilterGroup>
            </>
          )}
          {has("wall") && (
            <>
              <FilterGroup title="Muro solidario">
                {options.postTypes.map(t => (
                  <Chip key={t.value} active={filters.postType === t.value} onClick={() => setFilter("postType", t.value)}>
                    {t.label}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup title="Tipo de favor">
                {catalog.postCategories.map(c => (
                  <Chip key={c.value} active={filters.postCategory === c.value} onClick={() => setFilter("postCategory", c.value)}>
                    <CategoryIcon name={c.icon} className="size-3.5" />
                    {c.label}
                  </Chip>
                ))}
              </FilterGroup>
            </>
          )}
          {has("emergencies") && (
            <>
              <FilterGroup title="Emergencias">
                {options.emergencyStatuses.map(s => (
                  <Chip key={s.value} active={filters.emergencyStatus === s.value} onClick={() => setFilter("emergencyStatus", s.value)}>
                    {s.label}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup title="Tipo de ayuda">
                {catalog.emergencyCategories.map(c => (
                  <Chip key={c.value} active={filters.emergencyCategory === c.value} onClick={() => setFilter("emergencyCategory", c.value)}>
                    <CategoryIcon name={c.icon} className="size-3.5" />
                    {c.label}
                  </Chip>
                ))}
              </FilterGroup>
            </>
          )}
          {has("supportPoints") && (
            <FilterGroup title="Puntos de apoyo">
              <Chip active={!!filters.openPoints} onClick={() => setFilter("openPoints", true)}>
                {filters.openPoints && <Check className="size-3.5" />}
                Solo abiertos
              </Chip>
              {catalog.supportPointTypes.map(t => (
                <Chip key={t.value} active={filters.supportType === t.value} onClick={() => setFilter("supportType", t.value)}>
                  <CategoryIcon name={t.icon} className="size-3.5" />
                  {t.label}
                </Chip>
              ))}
            </FilterGroup>
          )}
          {(has("wall") || has("emergencies")) && (
            <FilterGroup title="Publicado">
              {options.periods.map(p => (
                <Chip
                  key={p.value}
                  active={(filters.period ?? "all") === p.value}
                  onClick={() => setFilters(prev => ({ ...prev, period: p.value === "all" ? undefined : p.value }))}
                >
                  {p.label}
                </Chip>
              ))}
            </FilterGroup>
          )}
          <div className="flex justify-between items-center pt-1">
            <button type="button" onClick={() => setFilters({})} className="text-xs font-bold text-gray-500 hover:text-gray-800">
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="h-9 px-4 rounded-xl bg-[#087F72] text-white text-xs font-bold"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}

      {view === "mapa" ? (
        <div className="relative w-full h-[480px] sm:h-[560px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-[#E8EFE9]">
          <NeighborhoodMap
            styleUrl={options.styleUrl}
            origin={origin.point}
            radius={radius}
            items={mapItems}
            approximateRadius={options.approximateRadius}
            selectedKey={current?.key ?? null}
            focus={focus}
            onSelect={item => {
              setSelected(item)
              setActionError("")
            }}
            onCenterChange={setCenter}
          />

          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-gray-700 shadow-sm">
              {loading ? "Buscando…" : `${items.length} lugares a ${options.radii.find(r => r.meters === radius)?.label ?? `${radius} m`} de ${origin.label.toLowerCase() === "mi casa" ? "tu casa" : origin.label}`}
            </span>
            {movedAway && !current && (
              <button
                type="button"
                onClick={() => chooseOrigin({ key: "zone", label: "Zona elegida", icon: "map-pin", point: center })}
                className="h-9 px-3.5 rounded-full bg-[#172B2A] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Search className="size-3.5" />
                Buscar en esta zona
              </button>
            )}
          </div>

          {failed && (
            <div className="absolute inset-x-4 top-16 z-20 rounded-2xl bg-white p-4 shadow-lg text-center space-y-2">
              <p className="text-sm font-bold text-gray-700">No pudimos cargar el mapa</p>
              <button
                type="button"
                onClick={() => setReloadKey(k => k + 1)}
                className="mx-auto h-9 px-4 rounded-xl border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Reintentar
              </button>
            </div>
          )}

          {current && (
            <ItemCard
              item={current}
              approximateRadius={options.approximateRadius}
              busy={busy}
              done={doneKeys.includes(current.key)}
              error={actionError}
              onClose={() => setSelected(null)}
              onSelectBusiness={onSelectBusiness}
              onRespond={() => runAction(current, () => onRespondPost(current))}
              onOnTheWay={() => runAction(current, () => onOnTheWay(current))}
              onOpenEmergency={onOpenEmergency}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {loading && <p className="text-xs text-gray-500 py-4">Buscando…</p>}
          {!loading && items.length === 0 && (
            <div className="py-10 text-center bg-white rounded-2xl border border-gray-200/70 p-6 space-y-1">
              <p className="text-sm font-bold text-gray-700">No hay nada en esta zona</p>
              <p className="text-xs text-gray-500">Prueba con una distancia mayor o quita algunos filtros.</p>
            </div>
          )}
          {items.map(item => {
            const style = layerStyle(item.layer)
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => showItem(item)}
                className="w-full text-left p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-gray-300 shadow-2xs flex items-start gap-3"
              >
                <span className={`size-10 shrink-0 rounded-full flex items-center justify-center ${style.soft}`}>
                  <CategoryIcon name={item.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-[#172B2A] leading-snug">{item.title}</span>
                    <span className="shrink-0 text-xs font-bold text-gray-500">
                      {item.approximate ? "~" : ""}
                      {formatDistance(item.distanceMeters)}
                    </span>
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">{item.subtitle}</span>
                  {item.badge && (
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        item.alert ? "bg-rose-100 text-[#BA1A1A]" : style.soft
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ItemCard({
  item,
  approximateRadius,
  busy,
  done,
  error,
  onClose,
  onSelectBusiness,
  onRespond,
  onOnTheWay,
  onOpenEmergency,
}: {
  item: MapItem
  approximateRadius: number
  busy: boolean
  done: boolean
  error: string
  onClose: () => void
  onSelectBusiness: (id: number) => void
  onRespond: () => void
  onOnTheWay: () => void
  onOpenEmergency: () => void
}) {
  const style = layerStyle(item.layer)
  const isWall = item.layer === "wall"
  const isEmergency = item.layer === "emergencies"
  const showTime = (isWall || isEmergency) && item.createdAt

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 max-w-lg mx-auto bg-white rounded-3xl p-4 shadow-xl border border-gray-100 space-y-3">
      <div className="flex items-start gap-3">
        <span className={`size-11 shrink-0 rounded-full flex items-center justify-center ${style.soft}`}>
          <CategoryIcon name={item.icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-[#172B2A] leading-tight">{item.title}</h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {[item.subtitle, item.distanceMeters !== null && `a ${item.approximate ? "unos " : ""}${formatDistance(item.distanceMeters)}`, showTime && timeAgo(item.createdAt!)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {item.badge && (
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                item.alert ? "bg-rose-100 text-[#BA1A1A]" : style.soft
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
          <X className="size-4" />
        </button>
      </div>

      {item.approximate && (
        <p className="text-[11px] text-gray-500">
          Ubicación aproximada (unos {approximateRadius} m) para cuidar la privacidad del vecino.
        </p>
      )}
      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {item.layer === "businesses" && (
          <button
            type="button"
            onClick={() => onSelectBusiness(item.id)}
            className="flex-1 h-10 px-4 rounded-xl bg-[#087F72] text-white font-bold text-xs hover:bg-[#075E54]"
          >
            Ver ficha
          </button>
        )}
        {isWall &&
          (item.mine ? (
            <span className="flex-1 h-10 px-4 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center">
              Tu publicación
            </span>
          ) : done ? (
            <span className="flex-1 h-10 px-4 rounded-xl bg-[#EAF5F1] text-[#087F72] font-bold text-xs flex items-center justify-center gap-1">
              <Check className="size-3.5" />
              Respuesta enviada
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onRespond}
              className="flex-1 h-10 px-4 rounded-xl bg-[#B45309] text-white font-bold text-xs disabled:opacity-60"
            >
              {busy ? "Enviando…" : item.type === "REQUEST" ? "Yo te ayudo" : "Me interesa"}
            </button>
          ))}
        {isEmergency && item.alert && !item.mine && !done && (
          <button
            type="button"
            disabled={busy}
            onClick={onOnTheWay}
            className="flex-1 h-10 px-4 rounded-xl bg-[#BA1A1A] text-white font-bold text-xs disabled:opacity-60"
          >
            {busy ? "Avisando…" : "Voy en camino"}
          </button>
        )}
        {isEmergency && (
          <button
            type="button"
            onClick={onOpenEmergency}
            className="flex-1 h-10 px-4 rounded-xl border border-[#BA1A1A] text-[#BA1A1A] font-bold text-xs"
          >
            Ver en Emergencia
          </button>
        )}
        {!item.approximate && (
          <a
            href={directionsUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-10 px-4 rounded-xl bg-white border border-[#087F72] text-[#087F72] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EAF5F1]"
          >
            <Navigation className="size-3.5" />
            Cómo llegar
          </a>
        )}
      </div>
      {isWall && done && (
        <p className="text-[11px] text-gray-500">Cuando te acepten, verás su número en «Mi actividad» del muro.</p>
      )}
    </div>
  )
}
