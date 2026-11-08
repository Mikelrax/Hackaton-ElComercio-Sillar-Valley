import { apiFetch } from "@/lib/api"
import { MapResult, MapSearchResult, Place, Spot } from "@/lib/types"

export interface LatLng {
  lat: number
  lng: number
}

export type Where = { addressId: number } | { latitude: number; longitude: number }

export type WhereFields = { addressId?: number; latitude?: number; longitude?: number }

export interface MapFilters {
  businessCategory?: string
  openNow?: boolean
  recommended?: boolean
  postType?: string
  postCategory?: string
  emergencyCategory?: string
  emergencyStatus?: string
  supportType?: string
  openPoints?: boolean
  period?: string
}

export interface MapQuery {
  center: LatLng
  radius: number
  layers: string[]
  filters: MapFilters
}

function params(entries: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === "" || value === false) continue
    search.set(key, String(value))
  }
  return search.toString()
}

export const mapApi = {
  items({ center, radius, layers, filters }: MapQuery): Promise<MapResult> {
    const query = params({ lat: center.lat, lng: center.lng, radius, layers: layers.join(","), ...filters })
    return apiFetch<MapResult>(`/api/map?${query}`)
  },

  search(q: string, center: LatLng): Promise<MapSearchResult> {
    return apiFetch<MapSearchResult>(`/api/map/search?${params({ q, lat: center.lat, lng: center.lng })}`)
  },
}

export const geoApi = {
  spot(point: LatLng): Promise<Spot> {
    return apiFetch<Spot>(`/api/geo/spot?${params({ lat: point.lat, lng: point.lng })}`, { auth: false })
  },

  places(q: string, near?: LatLng): Promise<Place[]> {
    return apiFetch<Place[]>(`/api/geo/places?${params({ q, lat: near?.lat, lng: near?.lng })}`, { auth: false })
  },
}

export function directionsUrl(point: { latitude: number; longitude: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}&travelmode=walking`
}

export function circle(center: LatLng, meters: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const coordinates: [number, number][] = []
  const dLat = meters / 111320
  const dLng = meters / (111320 * Math.cos((center.lat * Math.PI) / 180))
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    coordinates.push([center.lng + dLng * Math.sin(angle), center.lat + dLat * Math.cos(angle)])
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordinates] } }
}

export function bounds(center: LatLng, meters: number): [[number, number], [number, number]] {
  const dLat = meters / 111320
  const dLng = meters / (111320 * Math.cos((center.lat * Math.PI) / 180))
  return [
    [center.lng - dLng, center.lat - dLat],
    [center.lng + dLng, center.lat + dLat],
  ]
}

export function metersBetween(a: LatLng, b: LatLng): number {
  const dy = (b.lat - a.lat) * 111320
  const dx = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

export function currentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("sin gps"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { timeout: 10000, enableHighAccuracy: true }
    )
  })
}
