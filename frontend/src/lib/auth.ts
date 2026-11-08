import { apiFetch, SESSION_KEY } from "@/lib/api"
import { DemoAccount, GeoPoint } from "@/lib/types"

export type UserRole = "vecino" | "emprendedor" | "moderador"
export type UserProfile = "mayor" | "familia" | "joven" | "adulto"

export interface UserLocation {
  lat: number
  lng: number
  neighborhood: string
  address?: string
}

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  profile: UserProfile
  location: UserLocation
  token?: string
  expiresAt?: number
  verified?: boolean
  reputation?: {
    recommendationsCount: number
    favorsCount: number
  }
}

export interface LoginCredentials {
  phone: string
  password: string
}

export interface AddressInput {
  label?: string
  reference?: string
  latitude: number
  longitude: number
}

export interface RegisterData {
  name: string
  phone: string
  password: string
  inviteCode?: string
  address: AddressInput
}

export interface Address {
  id: number
  label: string
  neighborhood: string
  reference: string | null
  latitude: number
  longitude: number
  primary: boolean
  icon: string
}

interface BackendUser {
  id: number
  fullName: string
  phone: string
  role: "NEIGHBOR" | "MODERATOR"
  helpGiven: number
  primaryAddress: Address | null
  location: GeoPoint
}

interface AuthResponse {
  token: string
  expiresInSeconds: number
  user: BackendUser
}

function toLocation(user: BackendUser): UserLocation {
  return {
    lat: user.location.latitude,
    lng: user.location.longitude,
    neighborhood: user.location.neighborhood,
    address: user.primaryAddress?.reference ?? undefined,
  }
}

function toUser(res: AuthResponse): User {
  const b = res.user
  return {
    id: String(b.id),
    name: b.fullName,
    phone: b.phone,
    role: b.role === "MODERATOR" ? "moderador" : "vecino",
    profile: "adulto",
    location: toLocation(b),
    token: res.token,
    expiresAt: Date.now() + res.expiresInSeconds * 1000,
    verified: true,
    reputation: { recommendationsCount: 0, favorsCount: b.helpGiven },
  }
}

export const authService = {
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    try {
      const data = localStorage.getItem(SESSION_KEY)
      const user: User | null = data ? JSON.parse(data) : null
      const expired = user?.expiresAt !== undefined && user.expiresAt < Date.now()
      if (!user?.token || expired || !user.location?.neighborhood) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return user
    } catch {
      return null
    }
  },

  setCurrentUser(user: User): void {
    if (typeof window === "undefined") return
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  },

  async refreshLocation(): Promise<void> {
    const me = await apiFetch<BackendUser>("/api/users/me")
    const user = this.getCurrentUser()
    if (user) this.setCurrentUser({ ...user, location: toLocation(me) })
  },

  demoAccounts(): Promise<DemoAccount[]> {
    return apiFetch<DemoAccount[]>("/api/auth/demo", { auth: false })
  },

  async demoLogin(key: string): Promise<User> {
    const res = await apiFetch<AuthResponse>(`/api/auth/demo/${encodeURIComponent(key)}`, {
      method: "POST",
      auth: false,
    })
    const user = toUser(res)
    this.setCurrentUser(user)
    return user
  },

  logout(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(SESSION_KEY)
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { identifier: credentials.phone, password: credentials.password },
    })
    const user = toUser(res)
    this.setCurrentUser(user)
    return user
  },

  async register(data: RegisterData): Promise<User> {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      auth: false,
      body: {
        fullName: data.name.trim(),
        phone: data.phone,
        password: data.password,
        inviteCode: data.inviteCode?.trim() || undefined,
        address: data.address,
      },
    })
    const user = toUser(res)
    this.setCurrentUser(user)
    return user
  },
}
