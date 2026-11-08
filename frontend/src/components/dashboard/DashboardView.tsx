"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Heart, Home, LogOut, Map, MapPin, Plus } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { User } from "@/lib/auth"
import { AppTab, BusinessSummary, EmergencyOverview, FavorItem, Option } from "@/lib/types"
import { postsApi } from "@/lib/posts"
import { businessesApi } from "@/lib/businesses"
import { emergencyApi } from "@/lib/emergency"
import { useCatalog } from "@/lib/catalog"

import { DirectoryView } from "@/components/neighbor/DirectoryView"
import { SolidarityWallView } from "@/components/neighbor/SolidarityWallView"
import { CommunityMapView } from "@/components/neighbor/CommunityMapView"
import { EmergencySOSView } from "@/components/neighbor/EmergencySOSView"
import { BusinessDetailModal } from "@/components/neighbor/BusinessDetailModal"
import {
  CreatePostModal,
  EmergencyKindValue,
  NewPostData,
  PostTypeSelection,
} from "@/components/neighbor/CreatePostModal"

interface DashboardViewProps {
  user: User
  onLogout: () => void
}

type LoadStatus = "loading" | "ready" | "error"

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "mapa", label: "Mapa", icon: Map },
  { id: "muro", label: "Muro solidario", icon: Heart },
]

export function DashboardView({ user, onLogout }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("inicio")
  const { catalog } = useCatalog()
  const location = useMemo(() => ({ lat: user.location.lat, lng: user.location.lng }), [user.location.lat, user.location.lng])
  const neighborhoodName = user.location?.neighborhood || "Tu barrio"

  const [favors, setFavors] = useState<FavorItem[]>([])
  const [wallStatus, setWallStatus] = useState<LoadStatus>("loading")
  const [wallReloadKey, setWallReloadKey] = useState(0)

  const [emergency, setEmergency] = useState<EmergencyOverview | null>(null)
  const [emergencyStatus, setEmergencyStatus] = useState<LoadStatus>("loading")
  const [emergencyReloadKey, setEmergencyReloadKey] = useState(0)

  const [mapBusinesses, setMapBusinesses] = useState<BusinessSummary[]>([])
  const [directoryKey, setDirectoryKey] = useState(0)

  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [createInitialType, setCreateInitialType] = useState<PostTypeSelection>("necesito")
  const [createEmergencyKind, setCreateEmergencyKind] = useState<EmergencyKindValue>("NEED")

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

  useEffect(() => {
    let cancelled = false
    emergencyApi
      .overview(user.location)
      .then(data => {
        if (cancelled) return
        setEmergency(data)
        setEmergencyStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setEmergencyStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [emergencyReloadKey, user.location])

  useEffect(() => {
    if (activeTab !== "mapa") return
    let cancelled = false
    businessesApi
      .search({ radius: 2200, lat: location.lat, lng: location.lng, size: 50 })
      .then(data => {
        if (!cancelled) setMapBusinesses(data.content)
      })
      .catch(() => {
        if (!cancelled) setMapBusinesses([])
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, location, directoryKey])

  const goTo = (tab: AppTab) => {
    if (tab === "emergencia") setEmergencyReloadKey(k => k + 1)
    setActiveTab(tab)
  }

  const reloadWall = () => {
    setWallStatus("loading")
    setWallReloadKey(k => k + 1)
  }

  const reloadEmergency = () => {
    setEmergencyStatus("loading")
    setEmergencyReloadKey(k => k + 1)
  }

  const openCreate = (type: PostTypeSelection, kind: EmergencyKindValue = "NEED") => {
    setCreateInitialType(type)
    setCreateEmergencyKind(kind)
    setModalKey(k => k + 1)
    setIsCreateModalOpen(true)
  }

  const handleRespond = (favor: FavorItem) =>
    postsApi.respond(
      favor.id,
      favor.type === "necesito" ? "¡Hola! Yo te puedo ayudar con esto." : "¡Hola! Me interesa lo que ofreces."
    )

  const modalCategories = useMemo<Record<PostTypeSelection, Option[]>>(
    () => ({
      necesito: catalog?.postCategories ?? [],
      ofrezco: catalog?.postCategories ?? [],
      recomiendo: (catalog?.businessCategories ?? []).map(c => ({ value: c.slug, label: c.name })),
      emergencia: catalog?.emergencyCategories ?? [],
    }),
    [catalog]
  )

  const handleCreatePost = async (data: NewPostData): Promise<string> => {
    if (data.type === "necesito" || data.type === "ofrezco") {
      const { favor, pending } = await postsApi.create({
        type: data.type,
        category: data.category,
        categoryLabel: data.categoryLabel,
        text: data.description,
        reference: data.reference,
        neighborhood: user.location?.neighborhood,
      })
      if (pending) return "¡Enviado! Un moderador lo revisará y luego aparecerá en el muro."
      setFavors(prev => [favor, ...prev])
      setActiveTab("muro")
      return "¡Publicado en el barrio!"
    }

    if (data.type === "emergencia") {
      await emergencyApi.report({
        kind: data.emergencyKind,
        category: data.category,
        title: data.description || undefined,
        peopleCount: data.emergencyKind === "NEED" ? data.peopleCount : undefined,
      })
      reloadEmergency()
      setActiveTab("emergencia")
      return "¡Alerta enviada! Tus vecinos ya pueden verla."
    }

    const created = await businessesApi.create({
      name: data.description,
      categorySlug: data.category,
      phone: data.phone || undefined,
      reference: data.reference || undefined,
      recommendation: { goodPrice: false, punctual: false, reliable: false },
    })
    if (created.status === "PENDING") {
      return "¡Gracias! Un moderador revisará tu recomendación antes de publicarla."
    }
    setDirectoryKey(k => k + 1)
    setActiveTab("inicio")
    return "¡Recomendación publicada!"
  }

  const mode = emergency?.mode

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172B2A] antialiased">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => goTo("inicio")} className="flex items-center hover:opacity-85" title="Ir a Inicio">
            <Logo size="md" />
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => goTo(t.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.id ? "bg-white text-[#087F72] shadow-xs" : "text-gray-600 hover:text-[#172B2A]"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => goTo("emergencia")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "emergencia" ? "bg-[#BA1A1A] text-white shadow-xs" : "text-[#BA1A1A] hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              Emergencia SOS
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openCreate("necesito")}
              className="hidden sm:flex h-9 px-4 rounded-xl bg-[#087F72] hover:bg-[#075E54] text-white font-bold text-xs items-center gap-1.5 shadow-sm"
            >
              <Plus className="size-4" />
              Publicar
            </button>

            <Link
              href="/direcciones"
              title="Mis direcciones"
              className="h-9 px-2.5 lg:px-3 rounded-xl border border-gray-200 bg-white hover:border-[#087F72] flex items-center gap-2 transition-colors"
            >
              <MapPin className="size-4 text-[#087F72]" />
              <span className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">{user.name}</span>
                <span className="text-[10px] text-gray-500">{neighborhoodName} · Mis direcciones</span>
              </span>
              <span className="sr-only lg:hidden">Mis direcciones</span>
            </Link>

            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="size-9 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {mode?.active && activeTab !== "emergencia" && (
        <button
          onClick={() => goTo("emergencia")}
          className="w-full bg-[#BA1A1A] text-white px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="size-4" />
          Modo emergencia activo: {mode.title}. Toca para ver reportes y puntos de apoyo.
        </button>
      )}

      <main className="flex-1 px-4 sm:px-6 py-6 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
        {activeTab === "inicio" && (
          <DirectoryView
            key={directoryKey}
            userName={user.name}
            userNeighborhood={neighborhoodName}
            location={location}
            onSelectBusiness={setSelectedBusinessId}
            onOpenMap={() => goTo("mapa")}
            onRecommendNew={() => openCreate("recomiendo")}
          />
        )}

        {activeTab === "mapa" && (
          <CommunityMapView
            center={location}
            businesses={mapBusinesses}
            reports={emergency?.reports ?? []}
            supportPoints={emergency?.supportPoints ?? []}
            onSelectBusiness={setSelectedBusinessId}
          />
        )}

        {activeTab === "muro" && (
          <SolidarityWallView
            favors={favors}
            status={wallStatus}
            onRetry={reloadWall}
            currentUserId={user.id}
            categories={catalog?.postCategories ?? []}
            onRespond={handleRespond}
            onOpenCreate={type => openCreate(type || "necesito")}
          />
        )}

        {activeTab === "emergencia" && (
          <EmergencySOSView
            overview={emergency}
            status={emergencyStatus}
            emergencyNumbers={catalog?.emergencyNumbers ?? []}
            onRetry={reloadEmergency}
            onChanged={() => setEmergencyReloadKey(k => k + 1)}
            onOpenCreate={kind => openCreate("emergencia", kind)}
            onOpenMap={() => goTo("mapa")}
          />
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 px-3 h-18 flex items-center justify-around shadow-lg">
        <button
          onClick={() => goTo("inicio")}
          className={`flex flex-col items-center gap-1 ${activeTab === "inicio" ? "text-[#087F72]" : "text-gray-500"}`}
        >
          <Home className="size-5" />
          <span className="text-[11px] font-bold">Inicio</span>
        </button>
        <button
          onClick={() => goTo("mapa")}
          className={`flex flex-col items-center gap-1 ${activeTab === "mapa" ? "text-[#087F72]" : "text-gray-500"}`}
        >
          <Map className="size-5" />
          <span className="text-[11px] font-bold">Mapa</span>
        </button>
        <button
          onClick={() => openCreate(activeTab === "emergencia" ? "emergencia" : "necesito")}
          className={`size-13 -mt-6 rounded-full text-white shadow-lg flex items-center justify-center ring-4 ring-white ${
            activeTab === "emergencia" ? "bg-[#BA1A1A]" : "bg-[#087F72]"
          }`}
          aria-label="Publicar"
        >
          <Plus className="size-7" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => goTo("muro")}
          className={`flex flex-col items-center gap-1 ${activeTab === "muro" ? "text-[#087F72]" : "text-gray-500"}`}
        >
          <Heart className="size-5" />
          <span className="text-[11px] font-bold">Muro</span>
        </button>
        <button
          onClick={() => goTo("emergencia")}
          className={`flex flex-col items-center gap-1 ${activeTab === "emergencia" ? "text-[#BA1A1A]" : "text-gray-500"}`}
        >
          <AlertTriangle className="size-5" />
          <span className="text-[11px] font-bold">Emergencia</span>
        </button>
      </nav>

      <BusinessDetailModal
        businessId={selectedBusinessId}
        location={location}
        onClose={() => setSelectedBusinessId(null)}
        onChanged={() => setDirectoryKey(k => k + 1)}
      />

      <CreatePostModal
        key={modalKey}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialType={createInitialType}
        initialEmergencyKind={createEmergencyKind}
        userNeighborhood={neighborhoodName}
        categories={modalCategories}
        emergencyKinds={catalog?.emergencyKinds ?? []}
        onSubmitPost={handleCreatePost}
      />
    </div>
  )
}
