"use client"

import React, { useEffect, useState } from "react"
import { Check, ChevronDown, ChevronUp, MessageCircle, RefreshCw } from "lucide-react"
import { ApiError } from "@/lib/api"
import { BackendPost, HelpResponse, postsApi, whatsappLink } from "@/lib/posts"

type PostWithResponses = BackendPost & { responses: HelpResponse[] }

interface Activity {
  posts: PostWithResponses[]
  sent: HelpResponse[]
}

const POST_STATUS_STYLE: Record<BackendPost["status"], string> = {
  PENDING: "bg-amber-100 text-[#8A5800]",
  APPROVED: "bg-[#d4f3eb] text-[#087F72]",
  REJECTED: "bg-rose-100 text-rose-700",
  FULFILLED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}

async function loadActivity(): Promise<Activity> {
  const [posts, sent] = await Promise.all([postsApi.listMine(), postsApi.listMyResponses()])
  const withResponses = await Promise.all(
    posts.map(async p => ({
      ...p,
      responses: p.status === "APPROVED" ? await postsApi.listResponses(p.id) : [],
    }))
  )
  return { posts: withResponses, sent }
}

function formatPhone(phone: string): string {
  const local = phone.startsWith("51") ? phone.slice(2) : phone
  return `+51 ${local.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}`
}

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez."
}

export function WallActivityPanel() {
  const [open, setOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [error, setError] = useState("")
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadActivity()
      .then(data => {
        if (cancelled) return
        setActivity(data)
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
      refresh()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyKey(null)
    }
  }

  const pendingToReview = activity?.posts.reduce(
    (n, p) => n + p.responses.filter(r => r.status === "PENDING").length,
    0
  )

  return (
    <div className="rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-black text-[#172B2A] flex items-center gap-2">
            Mi actividad
            {!!pendingToReview && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#8A5800] text-xs font-bold">
                {pendingToReview} por responder
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">Tus publicaciones y las respuestas de tus vecinos</p>
        </div>
        {open ? <ChevronUp className="size-4 text-gray-500" /> : <ChevronDown className="size-4 text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-gray-100 pt-4">
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          {!activity && !error && (
            <div className="py-4 flex items-center gap-2 text-xs text-gray-500">
              <div className="size-4 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
              Cargando tu actividad…
            </div>
          )}

          {activity && (
            <>
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wide text-gray-500">Mis publicaciones</h3>
                  <button
                    onClick={refresh}
                    className="text-xs font-bold text-[#087F72] flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="size-3" />
                    Actualizar
                  </button>
                </div>

                {activity.posts.length === 0 && (
                  <p className="text-xs text-gray-500">Todavía no publicaste nada en el muro.</p>
                )}

                {activity.posts.map(post => {
                  const accepted = post.responses.find(r => r.status === "ACCEPTED")
                  return (
                    <div key={post.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#172B2A] leading-snug">{post.title}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${POST_STATUS_STYLE[post.status]}`}>
                          {post.statusLabel}
                        </span>
                      </div>

                      {post.status === "PENDING" && (
                        <p className="text-xs text-gray-500">Un moderador la revisará antes de que aparezca en el muro.</p>
                      )}
                      {post.status === "REJECTED" && post.moderationNote && (
                        <p className="text-xs text-rose-700">Motivo: {post.moderationNote}</p>
                      )}

                      {post.status === "APPROVED" && post.responses.length === 0 && (
                        <p className="text-xs text-gray-500">Aún nadie respondió.</p>
                      )}

                      {post.responses.map(r => (
                        <div key={r.id} className="p-2.5 rounded-lg bg-gray-50 space-y-1.5">
                          <p className="text-xs">
                            <span className="font-bold">{r.helper.fullName}</span>
                            <span className="text-gray-500"> · {r.message}</span>
                          </p>

                          {r.status === "PENDING" && !accepted && (
                            <div className="flex gap-2">
                              <button
                                disabled={busyKey !== null}
                                onClick={() => run(`accept-${r.id}`, () => postsApi.acceptResponse(r.id))}
                                className="h-8 px-3 rounded-lg bg-[#087F72] text-white text-xs font-bold hover:bg-[#075E54] disabled:opacity-60"
                              >
                                {busyKey === `accept-${r.id}` ? "Aceptando…" : "Aceptar"}
                              </button>
                              <button
                                disabled={busyKey !== null}
                                onClick={() => run(`decline-${r.id}`, () => postsApi.declineResponse(r.id))}
                                className="h-8 px-3 rounded-lg border border-gray-300 text-gray-600 text-xs font-bold hover:bg-white disabled:opacity-60"
                              >
                                No, gracias
                              </button>
                            </div>
                          )}

                          {r.status === "ACCEPTED" && r.contactPhone && (
                            <a
                              href={whatsappLink(r.contactPhone, `Hola ${r.helper.fullName}, te escribo por Ayni: "${post.title}"`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F72] hover:underline"
                            >
                              <MessageCircle className="size-3.5" />
                              Escribir por WhatsApp · {formatPhone(r.contactPhone)}
                            </a>
                          )}
                          {r.status === "DECLINED" && <p className="text-xs text-gray-400">No aceptada</p>}
                        </div>
                      ))}

                      {accepted && post.status === "APPROVED" && (
                        <button
                          disabled={busyKey !== null}
                          onClick={() => run(`fulfill-${post.id}`, () => postsApi.fulfill(post.id))}
                          className="h-8 px-3 rounded-lg border border-[#087F72] text-[#087F72] text-xs font-bold flex items-center gap-1 hover:bg-[#EAF5F1] disabled:opacity-60"
                        >
                          <Check className="size-3.5" />
                          {busyKey === `fulfill-${post.id}` ? "Guardando…" : "Ya se cumplió el favor"}
                        </button>
                      )}
                    </div>
                  )
                })}
              </section>

              <section className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wide text-gray-500">Mis respuestas</h3>
                {activity.sent.length === 0 && (
                  <p className="text-xs text-gray-500">Cuando respondas a un vecino, lo verás aquí.</p>
                )}
                {activity.sent.map(r => (
                  <div key={r.id} className="p-3 rounded-xl border border-gray-200 space-y-1">
                    <p className="text-sm font-bold text-[#172B2A] leading-snug">{r.postTitle}</p>
                    <p
                      className={`text-xs font-semibold ${
                        r.status === "ACCEPTED" ? "text-[#087F72]" : "text-gray-500"
                      }`}
                    >
                      {r.statusLabel}
                    </p>
                    {r.status === "ACCEPTED" && r.contactPhone && (
                      <a
                        href={whatsappLink(r.contactPhone, `Hola, te escribo por Ayni sobre "${r.postTitle}"`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087F72] hover:underline"
                      >
                        <MessageCircle className="size-3.5" />
                        Coordinar por WhatsApp · {formatPhone(r.contactPhone)}
                      </a>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
