import { apiFetch } from "@/lib/api"
import { EmergencyMode, EmergencyOverview, EmergencyReport, ModerationStats, SupportPoint } from "@/lib/types"
import { UserLocation } from "@/lib/auth"

export interface NewEmergencyReport {
  kind: string
  category: string
  title?: string
  peopleCount?: number
}

export interface NewSupportPoint {
  name: string
  type: string
  neighborhood?: string
  address?: string
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

  overview(location?: UserLocation): Promise<EmergencyOverview> {
    const at = location ? `?lat=${location.lat}&lng=${location.lng}` : ""
    return apiFetch<EmergencyOverview>(`/api/emergency${at}`)
  },

  report(input: NewEmergencyReport): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>("/api/emergency/reports", { method: "POST", body: input })
  },

  onTheWay(id: number): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/on-the-way`, { method: "POST" })
  },

  attended(id: number): Promise<EmergencyReport> {
    return apiFetch<EmergencyReport>(`/api/emergency/reports/${id}/attended`, { method: "POST" })
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

  stats(): Promise<ModerationStats> {
    return apiFetch<ModerationStats>("/api/moderation/stats")
  },

  users(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>("/api/moderation/users")
  },

  setUserActive(id: number, active: boolean): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/api/moderation/users/${id}/active`, { method: "PATCH", body: { active } })
  },
}
