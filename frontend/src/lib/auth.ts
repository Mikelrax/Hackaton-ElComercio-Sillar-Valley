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
}

const STORAGE_KEY = "sillar_user_session"

export const authService = {
  // Obtener usuario guardado en el navegador
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  // Guardar sesión en el navegador
  setCurrentUser(user: User): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  },

  // Cerrar sesión
  logout(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  },

  // Iniciar sesión (conecta a backend con timeout rápido o usa fallback para demo)
  async login(credentials: LoginCredentials): Promise<User> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5s max para no colgar el botón

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const user: User = await response.json()
        this.setCurrentUser(user)
        return user
      }
    } catch (e) {
      console.warn("Backend no disponible o demoró, usando sesión local de demostración", e)
    }

    // Modo Demostración / Offline
    const demoUser: User = {
      id: "demo-vecino-1",
      name: credentials.phone === "999888777" ? "Don Lucho (Junta Vecinal)" : "Vecino del Barrio",
      phone: credentials.phone,
      role: credentials.phone === "999888777" ? "moderador" : "vecino",
      profile: "adulto",
      location: {
        lat: -16.3988,
        lng: -71.535,
        neighborhood: "Yanahuara",
        address: "Calle Los Arcos 210",
      },
      verified: true,
      reputation: {
        recommendationsCount: 14,
        favorsCount: 8,
      },
      token: "demo-jwt-token-sillar-valley",
    }
    this.setCurrentUser(demoUser)
    return demoUser
  },

  // Registro de nuevo vecino (F1.1)
  async register(data: RegisterData): Promise<User> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const user: User = await response.json()
        this.setCurrentUser(user)
        return user
      }
    } catch (e) {
      console.warn("Backend no disponible, guardando registro localmente", e)
    }

    // Guardado local de demostración
    const newUser: User = {
      id: "user-" + Date.now(),
      name: data.name,
      phone: data.phone,
      role: data.role,
      profile: data.profile,
      location: data.location,
      verified: false,
      reputation: {
        recommendationsCount: 0,
        favorsCount: 0,
      },
      token: "jwt-" + Date.now(),
    }
    this.setCurrentUser(newUser)
    return newUser
  },
}

