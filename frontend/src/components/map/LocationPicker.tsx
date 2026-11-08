"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useRef, useState } from "react"
import Map, { type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre"
import { LocateFixed, MapPin, Search, X } from "lucide-react"
import { currentPosition, geoApi, type LatLng } from "@/lib/map"
import { Place, Spot } from "@/lib/types"

export interface LocationPickerProps {
  styleUrl: string
  start: LatLng
  startZoom?: number
  confirmed?: boolean
  large?: boolean
  onChange: (spot: Spot | null) => void
}

type GpsState = "idle" | "locating" | "error"

export default function LocationPicker({
  styleUrl,
  start,
  startZoom = 13,
  confirmed = false,
  large = false,
  onChange,
}: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null)
  const lookupId = useRef(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [touched, setTouched] = useState(confirmed)
  const [spot, setSpot] = useState<Spot | null>(null)
  const [looking, setLooking] = useState(false)
  const [lookupFailed, setLookupFailed] = useState(false)
  const [gps, setGps] = useState<GpsState>("idle")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)

  const lookup = (point: LatLng) => {
    const id = ++lookupId.current
    setLooking(true)
    setLookupFailed(false)
    geoApi
      .spot(point)
      .then(found => {
        if (id !== lookupId.current) return
        setSpot(found)
        onChange(found)
      })
      .catch(() => {
        if (id !== lookupId.current) return
        setSpot(null)
        setLookupFailed(true)
        onChange(null)
      })
      .finally(() => {
        if (id === lookupId.current) setLooking(false)
      })
  }

  const goTo = (point: LatLng, zoom = 17) => {
    setTouched(true)
    mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom, duration: 900 })
  }

  const handleLoad = () => {
    if (confirmed) lookup(start)
  }

  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    const userMoved = Boolean(e.originalEvent)
    if (!touched && !userMoved) return
    if (userMoved) setTouched(true)
    lookup({ lat: e.viewState.latitude, lng: e.viewState.longitude })
  }

  const locate = () => {
    setGps("locating")
    currentPosition()
      .then(point => {
        setGps("idle")
        goTo(point)
      })
      .catch(() => setGps("error"))
  }

  const handleQuery = (value: string) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (value.trim().length < 3) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(() => {
      const center = mapRef.current?.getCenter()
      geoApi
        .places(value, center ? { lat: center.lat, lng: center.lng } : start)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 400)
  }

  const choosePlace = (place: Place) => {
    setQuery(place.name)
    setResults([])
    goTo({ lat: place.latitude, lng: place.longitude })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-[#78716C] pointer-events-none" />
        <input
          type="text"
          enterKeyHint="search"
          value={query}
          onChange={e => handleQuery(e.target.value)}
          placeholder="Busca tu calle o un lugar conocido"
          aria-label="Buscar una calle o lugar"
          className="w-full h-12 rounded-2xl border-2 border-[#E7E5E4] bg-white pl-11 pr-10 text-[16px] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#087F72]"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQuery("")}
            aria-label="Borrar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]"
          >
            <X className="size-4" />
          </button>
        )}
        {(results.length > 0 || (searching && query.trim().length >= 3)) && (
          <ul className="absolute z-30 mt-1 w-full rounded-2xl bg-white border border-[#E7E5E4] shadow-lg overflow-hidden">
            {searching && results.length === 0 && <li className="px-4 py-3 text-[14px] text-[#78716C]">Buscando…</li>}
            {results.map(place => (
              <li key={`${place.name}-${place.latitude}-${place.longitude}`}>
                <button
                  type="button"
                  onClick={() => choosePlace(place)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F5F5F4] flex items-start gap-2.5"
                >
                  <MapPin className="size-4 mt-1 shrink-0 text-[#087F72]" />
                  <span>
                    <span className="block text-[15px] font-semibold text-[#1C1917]">{place.name}</span>
                    <span className="block text-[13px] text-[#78716C]">
                      {[place.detail, place.neighborhood].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={`relative rounded-2xl overflow-hidden border border-[#E7E5E4] bg-[#E7E5E4] ${
          large ? "h-72 sm:h-80" : "h-60"
        }`}
      >
        <Map
          ref={mapRef}
          initialViewState={{ longitude: start.lng, latitude: start.lat, zoom: startZoom }}
          mapStyle={styleUrl}
          style={{ width: "100%", height: "100%" }}
          dragRotate={false}
          touchPitch={false}
          pitchWithRotate={false}
          attributionControl={{ compact: true }}
          onLoad={handleLoad}
          onMoveEnd={handleMoveEnd}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10">
          <MapPin className="size-11 text-[#087F72] drop-shadow-md" fill="#087F72" stroke="white" strokeWidth={1.5} />
        </div>
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-2 rounded-full bg-black/30 z-0" />
        <button
          type="button"
          onClick={locate}
          disabled={gps === "locating"}
          className="absolute top-3 right-3 z-10 h-11 px-4 rounded-full bg-white text-[#087F72] text-[15px] font-bold shadow-md border border-[#087F72]/30 flex items-center gap-2 disabled:opacity-70"
        >
          <LocateFixed className={`size-5 ${gps === "locating" ? "animate-pulse" : ""}`} />
          {gps === "locating" ? "Buscando…" : "Usar mi ubicación"}
        </button>
      </div>

      <div aria-live="polite" className="min-h-12">
        {gps === "error" && (
          <p className="text-[14px] font-semibold text-[#B91C1C]">
            No pudimos obtener tu ubicación. Mueve el mapa con el dedo o busca tu calle.
          </p>
        )}
        {!touched ? (
          <p className="text-[15px] text-[#57534E]">
            Mueve el mapa hasta que el pin quede sobre el lugar, o toca «Usar mi ubicación».
          </p>
        ) : looking ? (
          <p className="text-[15px] text-[#57534E]">Revisando el lugar…</p>
        ) : lookupFailed ? (
          <p className="text-[14px] font-semibold text-[#B91C1C]">No pudimos revisar ese punto. Mueve el mapa un poco.</p>
        ) : spot ? (
          <div className="rounded-xl bg-[#EAF5F1] border border-[#087F72]/25 px-3.5 py-2.5">
            <p className="text-[15px] text-[#1C1917]">
              Barrio: <strong>{spot.neighborhood}</strong>
            </p>
            {spot.street && (
              <p className="text-[14px] text-[#44403C]">
                Cerca de {spot.street}
                {spot.area ? ` (${spot.area})` : ""}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
