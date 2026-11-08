"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react"
import { ApiError } from "@/lib/api"
import { postsApi, timeAgo } from "@/lib/posts"
import { businessesApi } from "@/lib/businesses"

interface PendingItem {
  key: string
  badge: string
  badgeClass: string
  category: string
  title: string
  body: string | null
  author: string
  place: string | null
  createdAt: string
  approve: () => Promise<void>
  reject: (note: string) => Promise<void>
}

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez."
}

async function loadPending(): Promise<PendingItem[]> {
  const [posts, businesses] = await Promise.all([postsApi.listPending(), businessesApi.pending()])
  const fromPosts: PendingItem[] = posts.map(p => ({
    key: `post-${p.id}`,
    badge: p.type === "REQUEST" ? "Muro · Necesito" : "Muro · Ofrezco",
    badgeClass: p.type === "REQUEST" ? "bg-amber-100 text-[#8A5800]" : "bg-[#d4f3eb] text-[#087F72]",
    category: p.categoryLabel,
    title: p.title,
    body: p.description,
    author: p.author.fullName,
    place: p.neighborhood,
    createdAt: p.createdAt,
    approve: () => postsApi.approve(p.id),
    reject: note => postsApi.reject(p.id, note),
  }))
  const fromBusinesses: PendingItem[] = businesses.map(b => ({
    key: `business-${b.id}`,
    badge: "Negocio recomendado",
    badgeClass: "bg-sky-100 text-sky-800",
    category: b.categoryName,
    title: b.name,
    body: [b.description, b.phone && `Teléfono: +${b.phone}`, b.reference && `Referencia: ${b.reference}`]
      .filter(Boolean)
      .join("\n") || null,
    author: b.createdBy,
    place: b.neighborhood,
    createdAt: b.createdAt,
    approve: () => businessesApi.approve(b.id),
    reject: note => businessesApi.reject(b.id, note),
  }))
  return [...fromPosts, ...fromBusinesses].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function PendingPostsPanel({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<PendingItem[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState("")
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [rejectingKey, setRejectingKey] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  useEffect(() => {
    let cancelled = false
    loadPending()
      .then(list => {
        if (cancelled) return
        setItems(list)
        setError("")
      })
      .catch(err => {
        if (!cancelled) setError(errorText(err))
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const refresh = () => setReloadKey(k => k + 1)

  const run = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key)
    setError("")
    try {
      await action()
      setRejectingKey(null)
      setRejectNote("")
      refresh()
      onChanged?.()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Por aprobar</h2>
        <button onClick={refresh} className="text-xs font-semibold text-[#087F72] hover:underline flex items-center gap-1">
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Lo que publican los vecinos en el muro y los negocios que recomiendan aparecen aquí. Solo se muestran a todos cuando los apruebas.
      </p>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {!items && !error && (
        <div className="py-6 flex items-center gap-2 text-xs text-gray-500">
          <div className="size-4 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
          Cargando…
        </div>
      )}

      {items?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-500">
          No hay nada pendiente. ¡Todo al día!
        </div>
      )}

      {items?.map(item => (
        <div key={item.key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className={`px-2 py-0.5 rounded-md ${item.badgeClass}`}>{item.badge}</span>
            <span className="text-gray-500">{item.category}</span>
            <span className="text-gray-400 font-medium">· {timeAgo(item.createdAt)}</span>
          </div>
          <div>
            <p className="text-base font-bold">{item.title}</p>
            {item.body && <p className="text-xs text-gray-600 whitespace-pre-line mt-1">{item.body}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Por {item.author}
              {item.place ? ` · ${item.place}` : ""}
            </p>
          </div>

          {rejectingKey === item.key ? (
            <div className="space-y-2">
              <input
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Motivo para el vecino (ej. falta información)"
                aria-label="Motivo del rechazo"
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <div className="flex gap-2">
                <button
                  disabled={busyKey !== null || !rejectNote.trim()}
                  onClick={() => run(item.key, () => item.reject(rejectNote.trim()))}
                  className="h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirmar rechazo
                </button>
                <button
                  onClick={() => {
                    setRejectingKey(null)
                    setRejectNote("")
                  }}
                  className="h-8 px-3 rounded-lg border border-gray-300 text-gray-600 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={busyKey !== null}
                onClick={() => run(item.key, item.approve)}
                className="h-8 px-3 rounded-lg bg-[#087F72] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#075E54] disabled:opacity-60"
              >
                <CheckCircle2 className="size-3.5" />
                {busyKey === item.key ? "Aprobando…" : "Aprobar"}
              </button>
              <button
                disabled={busyKey !== null}
                onClick={() => setRejectingKey(item.key)}
                className="h-8 px-3 rounded-lg border border-rose-300 text-rose-600 text-xs font-bold flex items-center gap-1 hover:bg-rose-50 disabled:opacity-60"
              >
                <XCircle className="size-3.5" />
                Rechazar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
