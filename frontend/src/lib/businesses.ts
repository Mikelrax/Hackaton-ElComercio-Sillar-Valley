import { apiFetch } from "@/lib/api"
import { WhereFields } from "@/lib/map"
import { BusinessDetail, BusinessSearchResult } from "@/lib/types"

export interface BusinessFilters {
  q?: string
  category?: string | null
  radius?: number | null
  openNow?: boolean
  sort?: string
  lat?: number
  lng?: number
  size?: number
}

export interface RecommendInput {
  goodPrice: boolean
  punctual: boolean
  reliable: boolean
  comment?: string
}

export type NewBusiness = {
  name: string
  categorySlug: string
  description?: string
  phone?: string
  reference?: string
  recommendation?: RecommendInput
} & WhereFields

function query(filters: BusinessFilters): string {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set("q", filters.q.trim())
  if (filters.category) params.set("category", filters.category)
  if (filters.radius) params.set("radius", String(filters.radius))
  if (filters.openNow) params.set("openNow", "true")
  if (filters.sort) params.set("sort", filters.sort)
  if (filters.lat !== undefined && filters.lng !== undefined) {
    params.set("lat", String(filters.lat))
    params.set("lng", String(filters.lng))
  }
  params.set("size", String(filters.size ?? 30))
  return params.toString()
}

export const businessesApi = {
  search(filters: BusinessFilters): Promise<BusinessSearchResult> {
    return apiFetch<BusinessSearchResult>(`/api/businesses?${query(filters)}`)
  },

  detail(id: number, coords?: { lat: number; lng: number }): Promise<BusinessDetail> {
    const at = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : ""
    return apiFetch<BusinessDetail>(`/api/businesses/${id}${at}`)
  },

  create(input: NewBusiness): Promise<BusinessDetail> {
    return apiFetch<BusinessDetail>("/api/businesses", { method: "POST", body: input })
  },

  recommend(id: number, input: RecommendInput): Promise<BusinessDetail> {
    return apiFetch<BusinessDetail>(`/api/businesses/${id}/recommendations`, { method: "POST", body: input })
  },

  pending(): Promise<BusinessDetail[]> {
    return apiFetch<BusinessDetail[]>("/api/moderation/businesses")
  },

  async approve(id: number): Promise<void> {
    await apiFetch(`/api/moderation/businesses/${id}/approve`, { method: "POST" })
  },

  async reject(id: number, note: string): Promise<void> {
    await apiFetch(`/api/moderation/businesses/${id}/reject`, { method: "POST", body: { note } })
  },
}
