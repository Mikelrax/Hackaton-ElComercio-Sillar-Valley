import { apiFetch, SESSION_KEY } from "@/lib/api"

export type UserRole = "vecino" | "emprendedor" | "moderador"
export type UserProfile = "mayor" | "familia" | "joven" | "adulto"

export interface UserLocation {
  lat: number
  lng: number
  neighborhood?: string
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
  neighborhood: string
  reference?: string
  latitude?: number
  longitude?: number
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
  latitude: number | null
  longitude: number | null
  primary: boolean
}

interface BackendUser {
  id: number
  fullName: string
  phone: string
  role: "NEIGHBOR" | "MODERATOR"
  helpGiven: number
  primaryAddress: Address | null
}

interface AuthResponse {
  token: string
  expiresInSeconds: number
  user: BackendUser
}

const DEFAULT_COORDS = { lat: -16.3988, lng: -71.535 }

function toLocation(address: Address | null): UserLocation {
  return {
    lat: address?.latitude ?? DEFAULT_COORDS.lat,
    lng: address?.longitude ?? DEFAULT_COORDS.lng,
    neighborhood: address?.neighborhood,
    address: address?.reference ?? undefined,
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
    location: toLocation(b.primaryAddress),
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
      if (!user?.token || (user.expiresAt && user.expiresAt < Date.now())) {
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

  updatePrimaryAddress(address: Address): void {
    const user = this.getCurrentUser()
    if (user) this.setCurrentUser({ ...user, location: toLocation(address) })
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
