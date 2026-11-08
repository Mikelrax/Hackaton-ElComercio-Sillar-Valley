"use client"

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { ArrowUp, BookOpen, ChevronRight, LifeBuoy, Phone, RefreshCw, RotateCcw, ThumbsUp, Volume2, WifiOff, X } from "lucide-react"
import { ApiError } from "@/lib/api"
import { formatDistance } from "@/lib/catalog"
import { kusiApi } from "@/lib/kusi"
import { KusiDraft, KusiDraftType, KusiReply, Option } from "@/lib/types"
import { useDialog } from "@/lib/use-dialog"
import { CategoryIcon, categoryTone } from "@/components/ui/category-icon"
import { KusiAvatar } from "@/components/kusi/KusiAvatar"

interface KusiChatProps {
  open: boolean
  covered: boolean
  firstName: string
  location: { lat: number; lng: number }
  emergencyNumbers: Option[]
  onClose: () => void
  onSelectBusiness: (id: number) => void
  onOpenWall: () => void
  onOpenEmergency: () => void
  onDraft: (draft: KusiDraft) => void
  onOpenTutorial: () => void
}

interface Entry {
  id: number
  role: "user" | "assistant"
  text: string
  reply?: KusiReply
  error?: boolean
}

const SUGGESTIONS = ["Busco un gasfitero cerca", "¿Cómo pido un favor?", "¿Dónde hay un punto de apoyo?"]

const OFFLINE = "No tengo conexión a internet. Revisa tu señal e intenta de nuevo."
const GENERIC = "Algo salió mal. Intenta de nuevo en unos segundos."

const DRAFT_LABELS: Record<KusiDraftType, string> = {
  necesito: "Pedir un favor",
  ofrezco: "Ofrecer algo",
  recomiendo: "Recomendar un negocio",
  emergencia: "Avisar una emergencia",
}

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener)
  window.addEventListener("offline", listener)
  return () => {
    window.removeEventListener("online", listener)
    window.removeEventListener("offline", listener)
  }
}

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel()
}

function speak(text: string) {
  if (!speechSupported()) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "es-PE"
  utterance.rate = 0.95
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function KusiChat({
  open,
  covered,
  firstName,
  location,
  emergencyNumbers,
  onClose,
  onSelectBusiness,
  onOpenWall,
  onOpenEmergency,
  onDraft,
  onOpenTutorial,
}: KusiChatProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const nextId = useRef(1)
  const panelRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)

  const close = useCallback(() => {
    stopSpeaking()
    onClose()
  }, [onClose])

  useDialog(open && !covered, panelRef, close)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" })
  }, [open, entries.length, sending])

  if (!open) return null

  const sendWith = async (base: Entry[], raw: string) => {
    const text = raw.trim()
    if (!text || sending) return
    const userEntry: Entry = { id: nextId.current++, role: "user", text }
    const conversation = [...base, userEntry]
    setEntries(conversation)
    setInput("")
    setSending(true)
    try {
      const reply = await kusiApi.chat(
        conversation.map(e => ({ role: e.role, text: e.text })),
        location
      )
      setEntries(current => [...current, { id: nextId.current++, role: "assistant", text: reply.reply, reply }])
    } catch (err) {
      const message = err instanceof ApiError ? (err.status === 0 ? OFFLINE : err.message) : GENERIC
      setEntries(current => [...current, { id: nextId.current++, role: "assistant", text: message, error: true }])
    } finally {
      setSending(false)
    }
  }

  const send = (text: string) => sendWith(entries.filter(e => !e.error), text)

  const retry = () => {
    const clean = entries.filter(e => !e.error)
    const last = clean[clean.length - 1]
    if (!last || last.role !== "user") return
    void sendWith(clean.slice(0, -1), last.text)
  }

  const restart = () => {
    stopSpeaking()
    setEntries([])
    setInput("")
    inputRef.current?.focus()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const leaveTo = (action: () => void) => {
    close()
    action()
  }

  const canSpeak = speechSupported()
  const lastIndex = entries.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={close}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kusi-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full h-[100dvh] sm:h-[min(760px,90dvh)] sm:max-w-lg bg-[#F8FAFC] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="shrink-0 bg-white border-b border-gray-200 px-4 h-[68px] flex items-center gap-3">
          <KusiAvatar size={44} />
          <div className="flex-1 min-w-0">
            <h2 id="kusi-title" className="text-[19px] font-bold leading-tight text-[#172B2A]">
              Kusi
            </h2>
            <p className="text-[13px] text-gray-500 leading-tight">Asistente de Ayni · programa automático</p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={restart}
              aria-label="Empezar de nuevo"
              title="Empezar de nuevo"
              className="size-11 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100"
            >
              <RotateCcw className="size-5" />
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="size-11 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            <X className="size-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" aria-live="polite">
          <KusiBubble>
            Hola, {firstName}. Soy Kusi, el asistente de Ayni. Soy un programa automático, no una persona. Te ayudo a
            encontrar negocios, favores y puntos de apoyo en tu barrio. ¿Qué necesitas?
          </KusiBubble>

          {entries.length === 0 && (
            <div className="space-y-2.5 pl-11">
              {SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  disabled={!online}
                  className="w-full min-h-14 px-4 py-3 rounded-2xl bg-white border-2 border-[#087F72]/25 hover:border-[#087F72] text-left text-[16px] font-semibold text-[#087F72] disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={() => leaveTo(onOpenTutorial)}
                className="w-full min-h-14 px-4 py-3 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#087F72] text-left text-[16px] font-semibold text-[#172B2A] flex items-center gap-2.5"
              >
                <BookOpen className="size-5 text-[#087F72] shrink-0" />
                Ver el tutorial de Ayni
              </button>
            </div>
          )}

          {entries.map((entry, index) =>
            entry.role === "user" ? (
              <div key={entry.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#087F72] text-white px-4 py-3 text-[17px] leading-snug whitespace-pre-line">
                  {entry.text}
                </p>
              </div>
            ) : (
              <div key={entry.id} className="space-y-2.5">
                <KusiBubble error={entry.error}>{entry.text}</KusiBubble>
                <div className="pl-11 space-y-2.5">
                  {entry.reply?.showEmergencyNumbers && emergencyNumbers.length > 0 && (
                    <div className="grid gap-2">
                      {emergencyNumbers.map(n => (
                        <a
                          key={n.value}
                          href={`tel:${n.value}`}
                          className="h-14 px-4 rounded-2xl bg-[#BA1A1A] hover:bg-[#93000A] text-white text-[17px] font-bold flex items-center gap-3"
                        >
                          <Phone className="size-5 shrink-0" />
                          Llamar a {n.label} · {n.value}
                        </a>
                      ))}
                    </div>
                  )}

                  {entry.reply?.businesses.map(biz => (
                    <button
                      key={biz.id}
                      type="button"
                      onClick={() => onSelectBusiness(biz.id)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-[#087F72]/60 flex gap-3"
                    >
                      <span className={`size-12 shrink-0 rounded-2xl flex items-center justify-center ${categoryTone(biz.categorySlug)}`}>
                        <CategoryIcon name={biz.categoryIcon} className="size-6" />
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="block text-[16px] font-bold text-[#172B2A] truncate">{biz.name}</span>
                        <span className="block text-[14px] text-gray-600">
                          {biz.categoryName}
                          {biz.distanceMeters !== null && ` · ${formatDistance(biz.distanceMeters)}`}
                        </span>
                        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-[#087F72]">
                          <ThumbsUp className="size-4 shrink-0" />
                          {biz.recommendationsCount === 1
                            ? "Recomendado por 1 vecino"
                            : `Recomendado por ${biz.recommendationsCount} vecinos`}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-gray-400 self-center shrink-0" />
                    </button>
                  ))}

                  {entry.reply?.posts.map(post => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => leaveTo(onOpenWall)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-[#087F72]/60 flex gap-3 items-center"
                    >
                      <span className="min-w-0 flex-1 space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[13px] font-bold ${
                            post.type === "REQUEST" ? "bg-[#FEF3C7] text-[#78350F]" : "bg-[#CCFBF1] text-[#075E54]"
                          }`}
                        >
                          {post.typeLabel}
                        </span>
                        <span className="block text-[16px] font-semibold text-[#172B2A] leading-snug">{post.title}</span>
                        <span className="block text-[14px] text-gray-600">
                          {post.categoryLabel} · {post.neighborhood}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-gray-400 shrink-0" />
                    </button>
                  ))}

                  {entry.reply?.supportPoints.map(point => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => leaveTo(onOpenEmergency)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-rose-200 hover:border-rose-400 flex gap-3 items-center"
                    >
                      <span className="size-12 shrink-0 rounded-2xl bg-rose-50 text-[#BA1A1A] flex items-center justify-center">
                        <LifeBuoy className="size-6" />
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="block text-[16px] font-bold text-[#172B2A]">{point.name}</span>
                        <span className="block text-[14px] text-gray-600">
                          {point.typeLabel}
                          {point.distanceMeters !== null && ` · ${formatDistance(point.distanceMeters)}`}
                        </span>
                        {point.address && <span className="block text-[14px] text-gray-600">{point.address}</span>}
                      </span>
                      <ChevronRight className="size-5 text-gray-400 shrink-0" />
                    </button>
                  ))}

                  {entry.reply?.draft && (
                    <div className="rounded-2xl bg-white border-2 border-[#087F72]/30 p-3.5 space-y-3">
                      <p className="text-[14px] font-semibold text-gray-600">{DRAFT_LABELS[entry.reply.draft.type]}</p>
                      <p className="text-[16px] text-[#172B2A] leading-snug">«{entry.reply.draft.text}»</p>
                      <button
                        type="button"
                        onClick={() => {
                          const draft = entry.reply?.draft
                          if (draft) leaveTo(() => onDraft(draft))
                        }}
                        className="w-full h-14 rounded-2xl bg-[#087F72] hover:bg-[#075E54] text-white text-[17px] font-bold"
                      >
                        Revisar y publicar
                      </button>
                    </div>
                  )}

                  {entry.error && index === lastIndex && (
                    <button
                      type="button"
                      onClick={retry}
                      disabled={sending}
                      className="h-11 px-4 rounded-xl border-2 border-[#087F72] text-[#087F72] text-[15px] font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className="size-4" />
                      Intentar de nuevo
                    </button>
                  )}

                  {!entry.error && canSpeak && (
                    <button
                      type="button"
                      onClick={() => speak(entry.text)}
                      className="h-10 px-3 -ml-1 rounded-xl text-[15px] font-semibold text-[#087F72] hover:bg-[#EAF5F1] flex items-center gap-2"
                    >
                      <Volume2 className="size-5" />
                      Escuchar
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex items-center gap-2.5">
              <KusiAvatar size={36} />
              <p className="rounded-2xl rounded-tl-md bg-white border border-gray-200 px-4 py-3 text-[16px] text-gray-500 flex items-center gap-2">
                Kusi está pensando
                <span className="flex gap-1" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-gray-400 animate-bounce" />
                </span>
              </p>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {!online && (
          <p
            role="status"
            className="shrink-0 bg-amber-50 border-t border-amber-200 px-4 py-3 text-[15px] text-amber-900 flex items-start gap-2"
          >
            <WifiOff className="size-5 shrink-0 mt-0.5" />
            Kusi necesita internet. Tus publicaciones sí se guardan y se envían solas cuando vuelve la señal.
          </p>
        )}

        <form onSubmit={submit} className="shrink-0 bg-white border-t border-gray-200 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-1.5">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              rows={1}
              maxLength={500}
              disabled={!online}
              placeholder="Escribe tu pregunta…"
              aria-label="Escribe tu pregunta para Kusi"
              className="flex-1 min-h-14 max-h-32 rounded-2xl border-2 border-gray-200 focus:border-[#087F72] focus:outline-none px-4 py-3.5 text-[17px] leading-snug resize-none disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={!online || sending || !input.trim()}
              aria-label="Enviar pregunta"
              className="size-14 shrink-0 rounded-2xl bg-[#087F72] hover:bg-[#075E54] text-white flex items-center justify-center disabled:opacity-40"
            >
              <ArrowUp className="size-6" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[13px] text-gray-500 text-center">Puedes hablarle con el micrófono de tu teclado.</p>
        </form>
      </div>
    </div>
  )
}

function KusiBubble({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <KusiAvatar size={36} className="mt-0.5" />
      <p
        className={`max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 text-[17px] leading-snug whitespace-pre-line ${
          error ? "bg-rose-50 border border-rose-200 text-rose-900" : "bg-white border border-gray-200 text-[#172B2A]"
        }`}
      >
        {children}
      </p>
    </div>
  )
}
