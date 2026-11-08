export type AppTab = "inicio" | "mapa" | "muro" | "emergencia"

export interface Option {
  value: string
  label: string
}

export interface IconOption extends Option {
  icon: string
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

export interface MapOptions {
  styleUrl: string
  radii: RadiusOption[]
  defaultRadius: number
  layers: IconOption[]
  emergencyLayers: string[]
  postTypes: Option[]
  emergencyStatuses: Option[]
  periods: Option[]
  approximateRadius: number
}

export interface Catalog {
  city: GeoPoint
  neighborhoods: string[]
  postCategories: IconOption[]
  businessCategories: CategoryFacet[]
  emergencyKinds: Option[]
  emergencyCategories: IconOption[]
  supportPointTypes: IconOption[]
  emergencyNumbers: Option[]
  addressPlaces: PlaceOption[]
  maxAddresses: number
  directory: DirectoryOptions
  recommendationTags: Option[]
  openDays: Option[]
  vulnerableGroups: Option[]
  supportResources: Option[]
  map: MapOptions
  assistantEnabled?: boolean
}

export interface MapItem {
  key: string
  layer: string
  id: number
  type: string | null
  title: string
  subtitle: string
  icon: string
  badge: string | null
  alert: boolean
  mine: boolean
  approximate: boolean
  latitude: number
  longitude: number
  distanceMeters: number | null
  createdAt: string | null
}

export interface MapResult {
  items: MapItem[]
  counts: Record<string, number>
}

export interface Place {
  name: string
  detail: string
  latitude: number
  longitude: number
  neighborhood: string
}

export interface Spot {
  latitude: number
  longitude: number
  neighborhood: string
  street: string | null
  area: string | null
}

export interface MapSearchResult {
  items: MapItem[]
  places: Place[]
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
  details?: string
  author: string
  authorId?: string
  distanceText: string
  timeAgo: string
  isResolved?: boolean
  resolvedNote?: string
  respondedByMe?: boolean
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
  vulnerable: Option[]
  severity: "HIGH" | "MEDIUM" | "LOW"
  severityLabel: string
  status: "URGENT" | "ON_THE_WAY" | "AVAILABLE" | "ATTENDED"
  statusLabel: string
  verified: boolean
  reporter: string
  reporterPhone: string | null
  helper: string | null
  helperMessage: string | null
  mine: boolean
  helpingByMe: boolean
  claimCount: number
  claimedByMe: boolean
  claimers: Claimer[]
  neighborhood: string
  distanceMeters: number | null
  latitude: number
  longitude: number
  approximate: boolean
  createdAt: string
}

export interface SupportPoint {
  id: number
  name: string
  type: string
  typeLabel: string
  neighborhood: string
  address: string | null
  resources: Option[]
  hours: string | null
  open: boolean
  distanceMeters: number | null
  latitude: number
  longitude: number
}

export interface Contact {
  name: string
  phone: string
}

export interface Claimer extends Contact {
  message: string | null
}

export type SafetyStatus = "SAFE" | "NEED_HELP"

export interface SafetySummary {
  safe: number
  needHelp: number
  pending: number
  needHelpPeople: Contact[]
}

export interface EmergencyOverview {
  mode: EmergencyMode
  reports: EmergencyReport[]
  supportPoints: SupportPoint[]
  nearbyMeters: number | null
  myCheckIn: SafetyStatus | null
  safety: SafetySummary | null
  generatedAt: string
}

export interface ModerationStats {
  activeReports: number
  openSupportPoints: number
  users: number
  emergencyActive: boolean
}

export type KusiRole = "user" | "assistant"

export type KusiDraftType = "necesito" | "ofrezco" | "recomiendo" | "emergencia"

export interface KusiPostCard {
  id: number
  type: "REQUEST" | "OFFER"
  typeLabel: string
  category: string
  categoryLabel: string
  title: string
  neighborhood: string
  createdAt: string
}

export interface KusiDraft {
  type: KusiDraftType
  text: string
}

export interface KusiReply {
  reply: string
  businesses: BusinessSummary[]
  posts: KusiPostCard[]
  supportPoints: SupportPoint[]
  draft: KusiDraft | null
  showEmergencyNumbers: boolean
}
