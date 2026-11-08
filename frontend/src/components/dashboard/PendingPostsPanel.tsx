// src/components/dashboard/PendingPostsPanel.tsx
// Cola de moderación del muro solidario: el moderador aprueba o rechaza lo que publican los vecinos.
"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react"
import { ApiError } from "@/lib/api"
import { BackendPost, categoryLabel, postsApi, timeAgo } from "@/lib/posts"

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez."
}

export function PendingPostsPanel() {
  const [posts, setPosts] = useState<BackendPost[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  useEffect(() => {
    let cancelled = false
    postsApi
      .listPending()
      .then(items => {
        if (cancelled) return
        setPosts(items)
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

  const run = async (id: number, action: () => Promise<void>) => {
    setBusyId(id)
    setError("")
    try {
      await action()
      setRejectingId(null)
      setRejectNote("")
      refresh()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Publicaciones por aprobar</h2>
        <button
          onClick={refresh}
          className="text-xs font-semibold text-[#087F72] hover:underline flex items-center gap-1"
        >
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Lo que publican los vecinos en el muro solidario aparece aquí y solo se muestra a todos cuando lo apruebas.
      </p>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {!posts && !error && (
        <div className="py-6 flex items-center gap-2 text-xs text-gray-500">
          <div className="size-4 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
          Cargando publicaciones…
        </div>
      )}

      {posts?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-500">
          No hay publicaciones pendientes. ¡Todo al día!
        </div>
      )}

      {posts?.map(post => (
        <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span
              className={`px-2 py-0.5 rounded-md ${
                post.type === "REQUEST" ? "bg-amber-100 text-[#8A5800]" : "bg-[#d4f3eb] text-[#087F72]"
              }`}
            >
              {post.type === "REQUEST" ? "Necesito" : "Ofrezco"}
            </span>
            <span className="text-gray-500">{categoryLabel(post.category)}</span>
            <span className="text-gray-400 font-medium">· {timeAgo(post.createdAt)}</span>
          </div>
          <div>
            <p className="text-base font-bold">{post.title}</p>
            <p className="text-xs text-gray-600 whitespace-pre-line mt-1">{post.description}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Por {post.author.fullName}
              {post.neighborhood ? ` · ${post.neighborhood}` : ""}
            </p>
          </div>

          {rejectingId === post.id ? (
            <div className="space-y-2">
              <input
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Motivo para el vecino (ej. falta información)"
                className="w-full h-9 px-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <div className="flex gap-2">
                <button
                  disabled={busyId !== null || !rejectNote.trim()}
                  onClick={() => run(post.id, () => postsApi.reject(post.id, rejectNote.trim()))}
                  className="h-8 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirmar rechazo
                </button>
                <button
                  onClick={() => {
                    setRejectingId(null)
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
                disabled={busyId !== null}
                onClick={() => run(post.id, () => postsApi.approve(post.id))}
                className="h-8 px-3 rounded-lg bg-[#087F72] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#075E54] disabled:opacity-60"
              >
                <CheckCircle2 className="size-3.5" />
                {busyId === post.id ? "Aprobando…" : "Aprobar"}
              </button>
              <button
                disabled={busyId !== null}
                onClick={() => setRejectingId(post.id)}
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
