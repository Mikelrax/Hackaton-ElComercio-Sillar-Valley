export type AppTab = "inicio" | "mapa" | "muro" | "emergencia"

export interface Option {
  value: string
  label: string
}

export interface CategoryFacet {
  slug: string
  name: string
  icon: string
  count: number
}

export interface GeoPoint {
  latitude: number
  longitude: number
  neighborhood: string
}

export interface PlaceOption {
  value: string
  label: string
  icon: string
  custom: boolean
}

export interface RadiusOption {
  meters: number | null
  label: string
}

export interface DirectoryOptions {
  radii: RadiusOption[]
  defaultRadius: number | null
  sorts: Option[]
}

export interface Catalog {
  city: GeoPoint
  neighborhoods: string[]
  postCategories: Option[]
  businessCategories: CategoryFacet[]
  emergencyKinds: Option[]
  emergencyCategories: Option[]
  supportPointTypes: Option[]
  emergencyNumbers: Option[]
  addressPlaces: PlaceOption[]
  maxAddresses: number
  directory: DirectoryOptions
  recommendationTags: Option[]
}

export interface DemoAccount {
  key: string
  title: string
  summary: string
  role: "NEIGHBOR" | "MODERATOR"
  fullName: string
  neighborhood: string | null
}

export interface Landing {
  zones: string[]
  business: { name: string; categoryName: string; categoryIcon: string; recommendations: number } | null
  offer: { title: string; neighborhood: string | null } | null
  supportPoint: { name: string; typeLabel: string; neighborhood: string } | null
}

export interface ReputationTags {
  goodPrice: number
  punctual: number
  reliable: number
}

export interface BusinessSummary {
  id: number
  name: string
  categorySlug: string
  categoryName: string
  categoryIcon: string
  neighborhood: string
  distanceMeters: number | null
  openNow: boolean | null
  scheduleText: string
  recommendationsCount: number
  tags: ReputationTags
  latitude: number
  longitude: number
}

export interface BusinessRecommendation {
  author: string
  goodPrice: boolean
  punctual: boolean
  reliable: boolean
  comment: string | null
  createdAt: string
}

export interface BusinessDetail extends BusinessSummary {
  description: string | null
  phone: string | null
  reference: string | null
  priceHint: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  moderationNote: string | null
  createdBy: string
  recommendedByMe: boolean
  recommendations: BusinessRecommendation[]
  createdAt: string
}

export interface BusinessSearchResult {
  content: BusinessSummary[]
  totalElements: number
  categories: CategoryFacet[]
}

export type FavorType = "necesito" | "ofrezco"

export interface FavorItem {
  id: string
  type: FavorType
  category: string
  categoryLabel: string
  title: string
  description?: string
  author: string
  authorId?: string
  distanceText: string
  timeAgo: string
  isResolved?: boolean
  resolvedNote?: string
}

export interface EmergencyMode {
  active: boolean
  title: string | null
  message: string | null
  activatedAt: string | null
  activatedBy: string | null
}

export interface EmergencyReport {
  id: number
  kind: "NEED" | "OFFER"
  kindLabel: string
  category: string
  categoryLabel: string
  title: string
  peopleCount: number
  severity: "HIGH" | "MEDIUM" | "LOW"
  severityLabel: string
  status: "URGENT" | "ON_THE_WAY" | "ATTENDED"
  statusLabel: string
  verified: boolean
  reporter: string
  reporterPhone: string | null
  helper: string | null
  mine: boolean
  helpingByMe: boolean
  neighborhood: string
  distanceMeters: number | null
  latitude: number
  longitude: number
  createdAt: string
}

export interface SupportPoint {
  id: number
  name: string
  type: string
  typeLabel: string
  neighborhood: string
  address: string | null
  open: boolean
  distanceMeters: number | null
  latitude: number
  longitude: number
}

export interface EmergencyOverview {
  mode: EmergencyMode
  reports: EmergencyReport[]
  supportPoints: SupportPoint[]
}

export interface ModerationStats {
  activeReports: number
  openSupportPoints: number
  users: number
  emergencyActive: boolean
}
