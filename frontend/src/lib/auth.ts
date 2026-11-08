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
  /** Momento (ms) en que vence el token. */
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

export interface RegisterData {
  name: string
  phone: string
  password: string
  role: UserRole
  profile: UserProfile
  location: UserLocation
  /** Código de la junta vecinal: si es correcto, la cuenta se crea como moderador. */
  inviteCode?: string
}

// Respuesta de /api/auth/login y /api/auth/register
interface BackendUser {
  id: number
  fullName: string
  phone: string
  email: string | null
  role: "NEIGHBOR" | "MODERATOR"
  ayniPoints: number
  helpGiven: number
  helpReceived: number
}

interface AuthResponse {
  token: string
  expiresInSeconds: number
  user: BackendUser
}

// El backend todavía no guarda el perfil, si es emprendedor ni la ubicación:
// se recuerdan en este navegador, por usuario.
const PREFS_KEY = "ayni_profile_prefs"
const DEFAULT_LOCATION: UserLocation = { lat: -16.3988, lng: -71.535 }

interface ProfilePrefs {
  role?: "vecino" | "emprendedor"
  profile?: UserProfile
  location?: UserLocation
}

function readAllPrefs(): Record<string, ProfilePrefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")
  } catch {
    return {}
  }
}

function savePrefs(userId: string, prefs: ProfilePrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readAllPrefs(), [userId]: prefs }))
  } catch {
    // Sin almacenamiento disponible: se usan los valores por defecto.
  }
}

function toUser(res: AuthResponse): User {
  const b = res.user
  const id = String(b.id)
  const prefs = readAllPrefs()[id] ?? {}
  return {
    id,
    name: b.fullName,
    phone: b.phone,
    role: b.role === "MODERATOR" ? "moderador" : prefs.role ?? "vecino",
    profile: prefs.profile ?? "adulto",
    location: prefs.location ?? DEFAULT_LOCATION,
    token: res.token,
    expiresAt: Date.now() + res.expiresInSeconds * 1000,
    verified: true,
    reputation: { recommendationsCount: 0, favorsCount: b.helpGiven },
  }
}

export const authService = {
  // Usuario con sesión válida guardada en el navegador
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

  logout(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(SESSION_KEY)
  },

  // Ingreso con celular y contraseña (POST /api/auth/login)
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

  // Registro de nuevo vecino (POST /api/auth/register)
  async register(data: RegisterData): Promise<User> {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      auth: false,
      body: {
        fullName: data.name.trim(),
        phone: data.phone,
        password: data.password,
        inviteCode: data.inviteCode?.trim() || undefined,
      },
    })
    savePrefs(String(res.user.id), {
      role: data.role === "emprendedor" ? "emprendedor" : "vecino",
      profile: data.profile,
      location: data.location,
    })
    const user = toUser(res)
    this.setCurrentUser(user)
    return user
  },
}
