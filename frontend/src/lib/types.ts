// src/lib/types.ts
// Tipos unificados para los módulos de AYNI basados en el backlog y Figma

export type AppTab = "inicio" | "mapa" | "muro" | "emergencia"

// F2: Directorio Vecinal y Ficha de Negocio
export interface BusinessReview {
  id: string
  author: string
  initials: string
  timeAgo: string
  comment: string
  avatarColor: string
}

export interface BusinessItem {
  id: string
  name: string
  category: "Gasfitería" | "Comida casera" | "Costura" | "Bodega" | "Técnico" | "Salud" | "Otros"
  distanceMeters: number
  distanceText: string
  scheduleText: string
  isOpen: boolean
  recommendationsCount: number
  reputationTags: {
    goodPrice: number
    punctual: number
    reliable: number
  }
  description: string
  estimatedPrice: string
  phone: string
  whatsapp: string
  initial: string
  colorBg: string
  colorText: string
  reviews: BusinessReview[]
  coords: { x: number; y: number } // Coordenadas relativas en el mapa
}

// F3: Muro Solidario
export type FavorType = "necesito" | "ofrezco"
// Etiquetas de las categorías del backend (ver lib/posts.ts)
export type FavorCategory =
  | "Herramientas"
  | "Hogar"
  | "Cuidado"
  | "Alimentos"
  | "Educación"
  | "Movilidad"
  | "Salud"
  | "Otros"

export interface FavorItem {
  id: string
  type: FavorType
  category: FavorCategory
  title: string
  description?: string
  author: string
  authorId?: string
  distanceMeters: number
  distanceText: string
  timeAgo: string
  whatsapp?: string
  isResolved?: boolean
  resolvedNote?: string
  coords?: { x: number; y: number }
}

// F4: Modo Emergencia
export type EmergencySeverity = "alta" | "media" | "baja"
export type EmergencyStatus = "urgente" | "en_camino" | "atendido"

export interface EmergencyReportItem {
  id: string
  title: string
  peopleCount: number
  severity: EmergencySeverity
  status: EmergencyStatus
  statusText: string
  distanceMeters: number
  distanceText: string
  timeAgo: string
  reporter: string
  phone?: string
  coords?: { x: number; y: number }
}

export interface SupportPointItem {
  id: string
  name: string
  type: "albergue" | "salud" | "agua" | "acopio"
  distanceMeters: number
  distanceText: string
  isOpen: boolean
  coords: { x: number; y: number }
}

