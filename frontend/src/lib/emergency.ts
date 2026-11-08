import { apiFetch } from "@/lib/api"
import { EmergencyMode, EmergencyOverview, EmergencyReport, ModerationStats, SafetyStatus, SupportPoint } from "@/lib/types"
import { WhereFields } from "@/lib/map"

export type NewEmergencyReport = {
  kind: string
  category: string
  title?: string
  peopleCount?: number
  vulnerable?: string[]
} & WhereFields

export interface NewSupportPoint {
  name: string
  type: string
  neighborhood?: string
  address?: string
  resources?: string[]
  hours?: string
  latitude?: number
  longitude?: number
}

export interface AdminUser {
  id: number
  fullName: string
  phone: string
  role: "NEIGHBOR" | "MODERATOR"
  active: boolean
  ayniPoints: number
  helpGiven: number
  createdAt: string
  primaryAddress: { neighborhood: string } | null
}

export const emergencyApi = {
  mode(): Promise<EmergencyMode> {
    return apiFetch<EmergencyMode>("/api/emergency/mode")
  },

  overview(location?: { lat: number; lng: number }): Promise<EmergencyOverview> {
    const at = location ? `?lat=${location.lat}&lng=${location.lng}` : ""
    return apiFetch<EmergencyOverview>(`/api/emergency${at}`)
  },

  report(input: NewEmergencyReport, label: string): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>("/api/emergency/reports", { method: "POST", body: input, queue: label })
  },

  detail(id: number, location?: { lat: number; lng: number }): Promise<EmergencyReport> {
    const at = location ? `?lat=${location.lat}&lng=${location.lng}` : ""
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}${at}`)
  },

  onTheWay(id: number, message?: string): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/on-the-way`, { method: "POST", body: { message: message || null } })
  },

  release(id: number): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/release`, { method: "POST" })
  },

  claim(id: number, message?: string): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/claim`, { method: "POST", body: { message: message || null } })
  },

  attended(id: number): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/attended`, { method: "POST" })
  },

  checkIn(status: SafetyStatus, label: string): Promise<{ status: SafetyStatus; label: string }> {
    return apiFetch("/api/emergency/check-in", { method: "POST", body: { status }, queue: label })
  },

  verify(id: number): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/moderation/emergency/reports/${id}/verify`, { method: "POST" })
  },

  activate(title: string, message?: string): Promise<EmergencyMode> {
    return apiFetch<EmergencyMode>("/api/moderation/emergency/activate", { method: "POST", body: { title, message } })
  },

  deactivate(): Promise<EmergencyMode> {
    return apiFetch<EmergencyMode>("/api/moderation/emergency/deactivate", { method: "POST" })
  },

  addSupportPoint(input: NewSupportPoint): Promise<SupportPoint> {
    return apiFetch<SupportPoint>("/api/moderation/support-points", { method: "POST", body: input })
  },

  setSupportPointOpen(id: number, open: boolean): Promise<SupportPoint> {
    return apiFetch<SupportPoint>(`/api/moderation/support-points/${id}`, { method: "PATCH", body: { open } })
  },

  updateSupportPoint(id: number, input: { resources: string[]; hours: string }): Promise<SupportPoint> {
    return apiFetch<SupportPoint>(`/api/moderation/support-points/${id}`, { method: "PATCH", body: input })
  },

  stats(): Promise<ModerationStats> {
    return apiFetch<ModerationStats>("/api/moderation/stats")
  },

  users(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>("/api/moderation/users")
  },

  setUserActive(id: number, active: boolean): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/api/moderation/users/${id}/active`, { method: "PATCH", body: { active } })
  },

  temporaryPassword(id: number): Promise<{ fullName: string; password: string }> {
    return apiFetch(`/api/moderation/users/${id}/temporary-password`, { method: "POST" })
  },
}
