// Muro solidario conectado al backend: /api/posts, /api/posts/{id}/responses y /api/moderation/posts
import { apiFetch } from "@/lib/api"
import { FavorCategory, FavorItem, FavorType } from "@/lib/types"

type BackendCategory =
  | "HOGAR"
  | "SALUD"
  | "EDUCACION"
  | "TRANSPORTE"
  | "ALIMENTOS"
  | "HERRAMIENTAS"
  | "CUIDADO"
  | "OTROS"

const CATEGORY_LABELS: Record<BackendCategory, FavorCategory> = {
  HERRAMIENTAS: "Herramientas",
  HOGAR: "Hogar",
  CUIDADO: "Cuidado",
  ALIMENTOS: "Alimentos",
  EDUCACION: "Educación",
  TRANSPORTE: "Movilidad",
  SALUD: "Salud",
  OTROS: "Otros",
}

const LABEL_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([key, label]) => [label, key])
) as Record<FavorCategory, BackendCategory>

/** Categorías del muro en el orden en que se muestran. */
export const FAVOR_CATEGORIES = Object.values(CATEGORY_LABELS)

export interface BackendPost {
  id: number
  type: "REQUEST" | "OFFER"
  category: BackendCategory
  title: string
  description: string
  neighborhood: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELLED"
  author: { id: number; fullName: string }
  moderationNote: string | null
  createdAt: string
}

export interface HelpResponse {
  id: number
  postId: number
  postTitle: string
  helper: { id: number; fullName: string }
  message: string
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN"
  /** Teléfono de la otra persona; solo llega cuando la respuesta fue aceptada. */
  contactPhone: string | null
  createdAt: string
}

/** Enlace de WhatsApp para coordinar con la otra persona. */
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
}

export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return "ahora mismo"
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? "hace 1 día" : `hace ${days} días`
}

export function categoryLabel(category: BackendCategory): FavorCategory {
  return CATEGORY_LABELS[category] ?? "Otros"
}

function toFavor(p: BackendPost): FavorItem {
  return {
    id: String(p.id),
    type: p.type === "REQUEST" ? "necesito" : "ofrezco",
    category: categoryLabel(p.category),
    title: p.title,
    description: p.description,
    author: p.author.fullName.split(" ")[0] || p.author.fullName,
    authorId: String(p.author.id),
    distanceMeters: 0,
    distanceText: p.neighborhood || "Tu barrio",
    timeAgo: timeAgo(p.createdAt),
    isResolved: p.status === "FULFILLED",
  }
}

export interface NewFavor {
  type: FavorType
  category: FavorCategory
  text: string
  reference: string
  neighborhood?: string
}

export const postsApi = {
  /** Publicaciones aprobadas del muro, las más recientes primero. */
  async listWall(): Promise<FavorItem[]> {
    const page = await apiFetch<PageResponse<BackendPost>>("/api/posts?size=50")
    return page.content.map(toFavor)
  },

  /** Crea un pedido u oferta. Las de vecinos quedan pendientes hasta que un moderador las apruebe. */
  async create(data: NewFavor): Promise<{ favor: FavorItem; pending: boolean }> {
    const text = data.text.trim()
    const title =
      text || (data.type === "necesito" ? `Necesito ayuda: ${data.category}` : `Ofrezco ayuda: ${data.category}`)
    const description = [text || title, data.reference && `Referencia: ${data.reference}`]
      .filter(Boolean)
      .join("\n")
    const post = await apiFetch<BackendPost>("/api/posts", {
      method: "POST",
      body: {
        type: data.type === "necesito" ? "REQUEST" : "OFFER",
        category: LABEL_TO_CATEGORY[data.category] ?? "OTROS",
        title: title.slice(0, 150),
        description: description.slice(0, 2000),
        neighborhood: data.neighborhood?.slice(0, 120),
      },
    })
    return { favor: toFavor(post), pending: post.status === "PENDING" }
  },

  /** Responde a una publicación ("Yo te ayudo" / "Me interesa"). */
  async respond(postId: string, message: string): Promise<void> {
    await apiFetch(`/api/posts/${postId}/responses`, { method: "POST", body: { message } })
  },

  // ---------- mi actividad ----------
  async listMine(): Promise<BackendPost[]> {
    const page = await apiFetch<PageResponse<BackendPost>>("/api/posts/mine?size=50")
    return page.content
  },

  /** Respuestas recibidas en una publicación propia. */
  async listResponses(postId: number): Promise<HelpResponse[]> {
    return apiFetch<HelpResponse[]>(`/api/posts/${postId}/responses`)
  },

  /** Respuestas que yo envié; traen el teléfono del autor cuando me aceptaron. */
  async listMyResponses(): Promise<HelpResponse[]> {
    return apiFetch<HelpResponse[]>("/api/responses/mine")
  },

  async acceptResponse(responseId: number): Promise<void> {
    await apiFetch(`/api/responses/${responseId}/accept`, { method: "POST" })
  },

  async declineResponse(responseId: number): Promise<void> {
    await apiFetch(`/api/responses/${responseId}/decline`, { method: "POST" })
  },

  /** El autor confirma que ya recibió la ayuda: quien ayudó suma puntos ayni. */
  async fulfill(postId: number): Promise<void> {
    await apiFetch(`/api/posts/${postId}/fulfill`, { method: "POST" })
  },

  // ---------- moderación ----------
  async listPending(): Promise<BackendPost[]> {
    const page = await apiFetch<PageResponse<BackendPost>>("/api/moderation/posts?status=PENDING&size=50")
    return page.content
  },

  async approve(postId: number): Promise<void> {
    await apiFetch(`/api/moderation/posts/${postId}/approve`, { method: "POST" })
  },

  async reject(postId: number, note: string): Promise<void> {
    await apiFetch(`/api/moderation/posts/${postId}/reject`, { method: "POST", body: { note } })
  },
}
