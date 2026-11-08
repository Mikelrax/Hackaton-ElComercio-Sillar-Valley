// src/components/dashboard/DashboardView.tsx
// Dashboard Principal AYNI Responsive (Móvil con Figma Bottom Bar + Desktop Multi-columna)
"use client"

import React, { useEffect, useState } from "react"
import {
  Home,
  Map,
  Plus,
  Heart,
  AlertTriangle,
  LogOut,
  MapPin,
  Shield,
  Bell,
  ChevronRight,
} from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { User } from "@/lib/auth"
import { AppTab, BusinessItem, FavorCategory, FavorItem, EmergencyReportItem, SupportPointItem } from "@/lib/types"
import {
  INITIAL_BUSINESSES,
  INITIAL_EMERGENCY_REPORTS,
  INITIAL_SUPPORT_POINTS,
} from "@/lib/mockData"
import { postsApi } from "@/lib/posts"

// Subvistas
import { DirectoryView } from "@/components/neighbor/DirectoryView"
import { SolidarityWallView } from "@/components/neighbor/SolidarityWallView"
import { CommunityMapView } from "@/components/neighbor/CommunityMapView"
import { EmergencySOSView } from "@/components/neighbor/EmergencySOSView"
import { BusinessDetailModal } from "@/components/neighbor/BusinessDetailModal"
import { CreatePostModal, PostTypeSelection } from "@/components/neighbor/CreatePostModal"

interface DashboardViewProps {
  user: User
  onLogout: () => void
}

export function DashboardView({ user, onLogout }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("inicio")
  const [activeRadius, setActiveRadius] = useState("1 km")
  const [businesses, setBusinesses] = useState<BusinessItem[]>(INITIAL_BUSINESSES)
  // Muro solidario: viene del backend (/api/posts)
  const [favors, setFavors] = useState<FavorItem[]>([])
  const [wallStatus, setWallStatus] = useState<"loading" | "ready" | "error">("loading")
  const [wallReloadKey, setWallReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    postsApi
      .listWall()
      .then(items => {
        if (cancelled) return
        setFavors(items)
        setWallStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setWallStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [wallReloadKey])

  const reloadWall = () => {
    setWallStatus("loading")
    setWallReloadKey(k => k + 1)
  }

  const handleRespond = (favor: FavorItem) =>
    postsApi.respond(
      favor.id,
      favor.type === "necesito" ? "¡Hola! Yo te puedo ayudar con esto." : "¡Hola! Me interesa lo que ofreces."
    )
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReportItem[]>(
    INITIAL_EMERGENCY_REPORTS
  )
  const [supportPoints] = useState<SupportPointItem[]>(INITIAL_SUPPORT_POINTS)

  // Modales
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createInitialType, setCreateInitialType] = useState<PostTypeSelection>("necesito")
  const [userRecommendedIds, setUserRecommendedIds] = useState<string[]>([])

  // Recomendar un negocio
  const handleRecommendBusiness = (id: string) => {
    setUserRecommendedIds(prev => [...prev, id])
    setBusinesses(prev =>
      prev.map(b => (b.id === id ? { ...b, recommendationsCount: b.recommendationsCount + 1 } : b))
    )
  }

  // Crear nueva publicación. Devuelve el mensaje de confirmación que muestra el modal.
  const handleCreatePost = async (data: {
    type: PostTypeSelection
    category: string
    description: string
    location: string
  }): Promise<string> => {
    if (data.type === "necesito" || data.type === "ofrezco") {
      const { favor, pending } = await postsApi.create({
        type: data.type,
        category: data.category as FavorCategory,
        text: data.description,
        reference: data.location,
        neighborhood: user.location?.neighborhood,
      })
      if (pending) {
        return "¡Enviado! Un moderador lo revisará y luego aparecerá en el muro."
      }
      setFavors(prev => [favor, ...prev])
      setActiveTab("muro")
      return "¡Publicado en el barrio!"
    } else if (data.type === "emergencia") {
      const newReport: EmergencyReportItem = {
        id: "em-" + Date.now(),
        title: data.description || "Emergencia en el barrio",
        peopleCount: 1,
        severity: "alta",
        status: "urgente",
        statusText: "Voy en camino",
        distanceMeters: 150,
        distanceText: "~150 m",
        timeAgo: "ahora mismo",
        reporter: user.name,
        phone: user.phone,
        coords: { x: 52, y: 48 },
      }
      setEmergencyReports(prev => [newReport, ...prev])
      setActiveTab("emergencia")
      return "¡Alerta enviada al barrio!"
    }
    // Recomendación de negocio (todavía local, sin backend)
    {
      const bizName = data.description || "Negocio recomendado"
      const newBiz: BusinessItem = {
        id: "biz-" + Date.now(),
        name: bizName,
        category: data.category as BusinessItem["category"],
        distanceMeters: 200,
        distanceText: "200 m",
        scheduleText: "Abierto",
        isOpen: true,
        recommendationsCount: 1,
        reputationTags: { goodPrice: 1, punctual: 1, reliable: 1 },
        description: `Recomendado por ${user.name}: servicio de confianza en ${user.location?.neighborhood || "el barrio"}.`,
        estimatedPrice: "Precios accesibles",
        phone: user.phone || "999888777",
        whatsapp: user.phone || "51999888777",
        initial: bizName.charAt(0).toUpperCase() || "N",
        colorBg: "bg-teal-100",
        colorText: "text-teal-800",
        coords: { x: 45, y: 45 },
        reviews: [
          {
            id: "rev-" + Date.now(),
            author: user.name,
            initials: user.name.substring(0, 2).toUpperCase(),
            timeAgo: "hace unos momentos",
            comment: "Excelente servicio, 100% recomendado.",
            avatarColor: "bg-emerald-200 text-emerald-900",
          },
        ],
      }
      setBusinesses(prev => [newBiz, ...prev])
      setActiveTab("inicio")
      return "¡Recomendación publicada!"
    }
  }

  const neighborhoodName = user.location?.neighborhood || "Urb. Las Flores"

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172B2A] antialiased">
      {/* ================= CABECERA DE ESCRITORIO & TABLET ================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setActiveTab("inicio")}
            className="flex items-center text-left hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
            title="Ir a Inicio"
          >
            <Logo size="md" />
          </button>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("inicio")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inicio"
                  ? "bg-white text-[#087F72] shadow-xs"
                  : "text-gray-600 hover:text-[#172B2A]"
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setActiveTab("mapa")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "mapa"
                  ? "bg-white text-[#087F72] shadow-xs"
                  : "text-gray-600 hover:text-[#172B2A]"
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setActiveTab("muro")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "muro"
                  ? "bg-white text-[#087F72] shadow-xs"
                  : "text-gray-600 hover:text-[#172B2A]"
              }`}
            >
              Muro solidario
            </button>
            <button
              onClick={() => setActiveTab("emergencia")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "emergencia"
                  ? "bg-[#BA1A1A] text-white shadow-xs"
                  : "text-[#BA1A1A] hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              <span>Emergencia SOS</span>
            </button>
          </nav>

          {/* Perfil y Acciones Rápidas */}
          <div className="flex items-center gap-2.5">
            {/* Botón Desktop Publicar */}
            <button
              onClick={() => {
                setCreateInitialType("necesito")
                setIsCreateModalOpen(true)
              }}
              className="hidden sm:flex h-9 px-4 rounded-xl bg-[#087F72] hover:bg-[#075E54] active:scale-98 text-white font-bold text-xs items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="size-4" />
              <span>Publicar</span>
            </button>

            {/* Perfil Vecino */}
            <div className="hidden lg:flex flex-col text-right pr-1">
              <span className="text-xs font-bold leading-tight">{user.name}</span>
              <span className="text-[10px] text-gray-500 capitalize">{user.role} · {user.profile}</span>
            </div>

            {/* Cerrar Sesión */}
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="size-9 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 px-4 sm:px-6 py-6 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
        {activeTab === "inicio" && (
          <DirectoryView
            userName={user.name}
            userNeighborhood={neighborhoodName}
            businesses={businesses}
            onSelectBusiness={biz => setSelectedBusiness(biz)}
            onOpenMap={() => setActiveTab("mapa")}
            activeRadius={activeRadius}
            onChangeRadius={r => setActiveRadius(r)}
          />
        )}

        {activeTab === "mapa" && (
          <CommunityMapView
            businesses={businesses}
            favors={favors}
            supportPoints={supportPoints}
            onSelectBusiness={biz => setSelectedBusiness(biz)}
          />
        )}

        {activeTab === "muro" && (
          <SolidarityWallView
            favors={favors}
            status={wallStatus}
            onRetry={reloadWall}
            currentUserId={user.id}
            onRespond={handleRespond}
            onOpenCreate={type => {
              setCreateInitialType(type || "necesito")
              setIsCreateModalOpen(true)
            }}
          />
        )}

        {activeTab === "emergencia" && (
          <EmergencySOSView
            reports={emergencyReports}
            supportPoints={supportPoints}
            onOpenCreate={type => {
              setCreateInitialType(type || "emergencia")
              setIsCreateModalOpen(true)
            }}
            onOpenMap={() => setActiveTab("mapa")}
          />
        )}
      </main>

      {/* ================= BARRA DE NAVEGACIÓN INFERIOR (Figma Bottom Bar para Móviles) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 px-3 h-18 flex items-center justify-around shadow-lg">
        {/* 1. Inicio */}
        <button
          onClick={() => setActiveTab("inicio")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "inicio" ? "text-[#087F72]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Home className="size-5" />
          <span className="text-[11px] font-bold">Inicio</span>
        </button>

        {/* 2. Mapa */}
        <button
          onClick={() => setActiveTab("mapa")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "mapa" ? "text-[#087F72]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Map className="size-5" />
          <span className="text-[11px] font-bold">Mapa</span>
        </button>

        {/* 3. Botón Central Flotante (+) Publicar (Figma: botón circular verde petróleo o rojo en emergencia) */}
        <button
          onClick={() => {
            setCreateInitialType(activeTab === "emergencia" ? "emergencia" : "necesito")
            setIsCreateModalOpen(true)
          }}
          className={`size-13 -mt-6 rounded-full text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 ${
            activeTab === "emergencia"
              ? "bg-[#BA1A1A] hover:bg-[#9B1414] ring-4 ring-white"
              : "bg-[#087F72] hover:bg-[#075E54] ring-4 ring-white"
          }`}
          aria-label="Publicar en 3 clics"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </button>

        {/* 4. Muro */}
        <button
          onClick={() => setActiveTab("muro")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "muro" ? "text-[#087F72]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Heart className="size-5" />
          <span className="text-[11px] font-bold">Muro</span>
        </button>

        {/* 5. Emergencia */}
        <button
          onClick={() => setActiveTab("emergencia")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "emergencia" ? "text-[#BA1A1A]" : "text-gray-500 hover:text-[#BA1A1A]"
          }`}
        >
          <AlertTriangle className="size-5" />
          <span className="text-[11px] font-bold">Emergencia</span>
        </button>
      </nav>

      {/* ================= MODALES GLOBALES ================= */}
      {/* 1. Ficha Detalle de Negocio (Pantalla 2 Figma) */}
      <BusinessDetailModal
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        onRecommend={handleRecommendBusiness}
        userHasRecommended={selectedBusiness ? userRecommendedIds.includes(selectedBusiness.id) : false}
      />

      {/* 2. Flujo Publicar en 3 clics (Pantalla 4 Figma) */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialType={createInitialType}
        userNeighborhood={neighborhoodName}
        onSubmitPost={handleCreatePost}
      />
    </div>
  )
}
