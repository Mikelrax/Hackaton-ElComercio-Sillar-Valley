"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Catalog } from "@/lib/types"

let cached: Catalog | null = null
let pending: Promise<Catalog> | null = null

export function loadCatalog(): Promise<Catalog> {
  if (cached) return Promise.resolve(cached)
  if (!pending) {
    pending = apiFetch<Catalog>("/api/catalog", { auth: false })
      .then(data => {
        cached = data
        return data
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

export function useCatalog(): { catalog: Catalog | null; error: boolean } {
  const [catalog, setCatalog] = useState<Catalog | null>(cached)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    loadCatalog()
      .then(data => {
        if (!cancelled) setCatalog(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { catalog, error }
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return ""
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`
}
