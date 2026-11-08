"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useMemo, useRef, useState } from "react"
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre"
import { bounds, circle, type LatLng } from "@/lib/map"
import { MapItem } from "@/lib/types"
import { CategoryIcon } from "@/components/ui/category-icon"
import { layerStyle } from "@/components/map/layer-style"

export interface MapFocus {
  point: LatLng
  zoom: number
  seq: number
}

export interface NeighborhoodMapProps {
  styleUrl: string
  origin: LatLng
  radius: number
  items: MapItem[]
  approximateRadius: number
  selectedKey: string | null
  focus: MapFocus | null
  onSelect: (item: MapItem | null) => void
  onCenterChange: (center: LatLng) => void
}

interface Group {
  key: string
  lat: number
  lng: number
  items: MapItem[]
}

const TILE = 512
const GROUP_PIXELS = 44

function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE * Math.pow(2, zoom)
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

function group(items: MapItem[], zoom: number): Group[] {
  const groups: { x: number; y: number; items: MapItem[] }[] = []
  for (const item of items) {
    const p = project(item.latitude, item.longitude, zoom)
    const near = groups.find(g => Math.abs(g.x - p.x) < GROUP_PIXELS && Math.abs(g.y - p.y) < GROUP_PIXELS)
    if (near) near.items.push(item)
    else groups.push({ x: p.x, y: p.y, items: [item] })
  }
  return groups.map(g => ({
    key: g.items.map(i => i.key).join("|"),
    lat: g.items.reduce((s, i) => s + i.latitude, 0) / g.items.length,
    lng: g.items.reduce((s, i) => s + i.longitude, 0) / g.items.length,
    items: g.items,
  }))
}

export default function NeighborhoodMap({
  styleUrl,
  origin,
  radius,
  items,
  approximateRadius,
  selectedKey,
  focus,
  onSelect,
  onCenterChange,
}: NeighborhoodMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [zoom, setZoom] = useState(14)
  const [initialBounds] = useState(() => bounds(origin, radius))

  useEffect(() => {
    mapRef.current?.fitBounds(bounds(origin, radius), { padding: 32, duration: 700 })
  }, [origin, radius])

  useEffect(() => {
    if (!focus) return
    mapRef.current?.flyTo({ center: [focus.point.lng, focus.point.lat], zoom: focus.zoom, duration: 800 })
  }, [focus])

  const groups = useMemo(() => group(items, zoom), [items, zoom])

  const radiusShape = useMemo(() => circle(origin, radius), [origin, radius])

  const approximateShapes = useMemo<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: items
        .filter(i => i.approximate && i.key === selectedKey)
        .map(i => ({
          ...circle({ lat: i.latitude, lng: i.longitude }, approximateRadius, 32),
          properties: { color: layerStyle(i.layer).color },
        })),
    }),
    [items, approximateRadius, selectedKey]
  )

  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    setZoom(e.viewState.zoom)
    onCenterChange({ lat: e.viewState.latitude, lng: e.viewState.longitude })
  }

  const openGroup = (g: Group) => {
    mapRef.current?.easeTo({ center: [g.lng, g.lat], zoom: Math.min(zoom + 2, 19), duration: 500 })
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={{ bounds: initialBounds, fitBoundsOptions: { padding: 32 } }}
      mapStyle={styleUrl}
      style={{ width: "100%", height: "100%" }}
      dragRotate={false}
      touchPitch={false}
      pitchWithRotate={false}
      attributionControl={{ compact: true }}
      onLoad={e => setZoom(e.target.getZoom())}
      onMoveEnd={handleMoveEnd}
      onClick={() => onSelect(null)}
    >
      <NavigationControl position="top-right" showCompass={false} />

      <Source id="radius" type="geojson" data={radiusShape}>
        <Layer id="radius-fill" type="fill" paint={{ "fill-color": "#087F72", "fill-opacity": 0.06 }} />
        <Layer
          id="radius-line"
          type="line"
          paint={{ "line-color": "#087F72", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.7 }}
        />
      </Source>

      <Source id="approximate" type="geojson" data={approximateShapes}>
        <Layer
          id="approximate-fill"
          type="fill"
          paint={{ "fill-color": ["get", "color"], "fill-opacity": 0.12 }}
        />
        <Layer
          id="approximate-line"
          type="line"
          paint={{ "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.5 }}
        />
      </Source>

      <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
        <span className="relative flex size-5" aria-label="Tu punto de partida">
          <span className="absolute inline-flex size-full rounded-full bg-blue-500/40 animate-ping" />
          <span className="relative inline-flex size-5 rounded-full bg-blue-600 border-[3px] border-white shadow-md" />
        </span>
      </Marker>

      {groups.map(g => {
        if (g.items.length > 1) {
          const urgent = g.items.some(i => i.alert)
          return (
            <Marker
              key={g.key}
              longitude={g.lng}
              latitude={g.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation()
                openGroup(g)
              }}
            >
              <button
                type="button"
                aria-label={`${g.items.length} lugares aquí. Toca para acercar.`}
                className={`size-11 rounded-full border-[3px] border-white shadow-lg text-white text-[15px] font-black flex items-center justify-center ${
                  urgent ? "bg-[#BA1A1A]" : "bg-[#172B2A]"
                }`}
              >
                {g.items.length}
              </button>
            </Marker>
          )
        }
        const item = g.items[0]
        const style = layerStyle(item.layer)
        const selected = item.key === selectedKey
        return (
          <Marker
            key={item.key}
            longitude={item.longitude}
            latitude={item.latitude}
            anchor="center"
            style={{ zIndex: selected ? 3 : item.alert ? 2 : 1 }}
            onClick={e => {
              e.originalEvent.stopPropagation()
              onSelect(item)
            }}
          >
            <button
              type="button"
              aria-label={item.title}
              className={`relative size-10 rounded-full border-[3px] border-white shadow-lg text-white flex items-center justify-center transition-transform ${
                style.pin
              } ${selected ? "scale-125 ring-4 ring-black/20" : "hover:scale-110"} ${item.approximate ? "opacity-90" : ""}`}
            >
              {item.alert && <span className="absolute -inset-1 rounded-full bg-[#BA1A1A]/40 animate-ping" />}
              <CategoryIcon name={item.icon} className="relative size-[18px]" />
            </button>
          </Marker>
        )
      })}
    </Map>
  )
}
