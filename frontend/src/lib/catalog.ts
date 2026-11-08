"use client"

import { useSyncExternalStore } from "react"
import { apiFetch } from "@/lib/api"
import { Catalog } from "@/lib/types"

const STORAGE_KEY = "ayni_catalog"

interface CatalogState {
  catalog: Catalog | null
  error: boolean
}

const SERVER_STATE: CatalogState = { catalog: null, error: false }

let state: CatalogState = SERVER_STATE
let fresh = false
let pending: Promise<void> | null = null
let started = false
const listeners = new Set<() => void>()

function emit(next: CatalogState) {
  state = next
  listeners.forEach(listener => listener())
}

function readStored(): Catalog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Catalog) : null
  } catch {
    return null
  }
}

function store(catalog: Catalog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  } catch {}
}

function fetchCatalog(): Promise<void> {
  if (!pending) {
    pending = apiFetch<Catalog>("/api/catalog", { auth: false })
      .then(data => {
        fresh = true
        store(data)
        emit({ catalog: data, error: false })
      })
      .catch(() => {
        const fallback = state.catalog ?? readStored()
        emit({ catalog: fallback, error: !fallback })
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

function start() {
  if (started) return
  started = true
  const stored = readStored()
  if (stored) state = { catalog: stored, error: false }
  window.addEventListener("online", () => {
    if (!fresh) void fetchCatalog()
  })
  void fetchCatalog()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  if (state.catalog) listener()
  return () => {
    listeners.delete(listener)
  }
}

export function retryCatalog() {
  emit({ catalog: state.catalog, error: false })
  void fetchCatalog()
}

export function useCatalog(): { catalog: Catalog | null; error: boolean; retry: () => void } {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  )
  return { catalog: current.catalog, error: current.error, retry: retryCatalog }
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return ""
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`
}
