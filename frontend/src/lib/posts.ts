import { apiFetch } from "@/lib/api"
import { Where } from "@/lib/map"
import { FavorItem, FavorType } from "@/lib/types"

export interface BackendPost {
  id: number
  type: "REQUEST" | "OFFER"
  category: string
  categoryLabel: string
  title: string
  description: string
  neighborhood: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELLED"
  statusLabel: string
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
  statusLabel: string
  contactPhone: string | null
  createdAt: string
}

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

function toFavor(p: BackendPost): FavorItem {
  return {
    id: String(p.id),
    type: p.type === "REQUEST" ? "necesito" : "ofrezco",
    category: p.category,
    categoryLabel: p.categoryLabel,
    title: p.title,
    description: p.description,
    author: p.author.fullName.split(" ")[0] || p.author.fullName,
    authorId: String(p.author.id),
    distanceText: p.neighborhood ?? "",
    timeAgo: timeAgo(p.createdAt),
    isResolved: p.status === "FULFILLED",
  }
}

export interface NewFavor {
  type: FavorType
  category: string
  categoryLabel: string
  text: string
  reference: string
  where: Where | null
}

export const postsApi = {
  async listWall(): Promise<FavorItem[]> {
    const page = await apiFetch<PageResponse<BackendPost>>("/api/posts?size=50")
    return page.content.map(toFavor)
  },

  async create(data: NewFavor): Promise<{ favor: FavorItem; pending: boolean }> {
    const text = data.text.trim()
    const title =
      text ||
      (data.type === "necesito" ? `Necesito ayuda: ${data.categoryLabel}` : `Ofrezco ayuda: ${data.categoryLabel}`)
    const description = [text || title, data.reference && `Referencia: ${data.reference}`]
      .filter(Boolean)
      .join("\n")
    const post = await apiFetch<BackendPost>("/api/posts", {
      method: "POST",
      queue: title.slice(0, 80),
      body: {
        type: data.type === "necesito" ? "REQUEST" : "OFFER",
        category: data.category,
        title: title.slice(0, 150),
        description: description.slice(0, 2000),
        ...(data.where ?? {}),
      },
    })
    return { favor: toFavor(post), pending: post.status === "PENDING" }
  },

  async respond(postId: string, message: string): Promise<void> {
    await apiFetch(`/api/posts/${postId}/responses`, { method: "POST", body: { message } })
  },

  async listMine(): Promise<BackendPost[]> {
    const page = await apiFetch<PageResponse<BackendPost>>("/api/posts/mine?size=50")
    return page.content
  },

  async listResponses(postId: number): Promise<HelpResponse[]> {
    return apiFetch<HelpResponse[]>(`/api/posts/${postId}/responses`)
  },

  async listMyResponses(): Promise<HelpResponse[]> {
    return apiFetch<HelpResponse[]>("/api/responses/mine")
  },

  async acceptResponse(responseId: number): Promise<void> {
    await apiFetch(`/api/responses/${responseId}/accept`, { method: "POST" })
  },

  async declineResponse(responseId: number): Promise<void> {
    await apiFetch(`/api/responses/${responseId}/decline`, { method: "POST" })
  },

  async fulfill(postId: number): Promise<void> {
    await apiFetch(`/api/posts/${postId}/fulfill`, { method: "POST" })
  },

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
