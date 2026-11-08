"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, CircleHelp, Heart, Home, LogOut, Map, MapPin, Plus, Shield, WifiOff } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Address, User } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { AppTab, EmergencyMode, EmergencyOverview, FavorItem, KusiDraft, MapItem, Option } from "@/lib/types"
import { currentPosition, type LatLng } from "@/lib/map"
import { DEFAULT_RESPONSE } from "@/lib/confirm-specs"
import { ItemDetailSheet } from "@/components/neighbor/ItemDetailSheet"
import type { EmergencyOrigin } from "@/components/neighbor/EmergencySOSView"
import { postsApi } from "@/lib/posts"
import { businessesApi } from "@/lib/businesses"
import { emergencyApi } from "@/lib/emergency"
import { addressesApi } from "@/lib/addresses"
import { useCatalog } from "@/lib/catalog"
import { flushOutbox, useOutbox } from "@/lib/outbox"
import { outboxSnapshot, setOutboxFailure } from "@/lib/outbox-store"
import { markTutorialSeen, TutorialOverlay, tutorialRequested } from "@/components/onboarding/TutorialOverlay"
import { KusiChat } from "@/components/kusi/KusiChat"

import { DirectoryView } from "@/components/neighbor/DirectoryView"
import { SolidarityWallView } from "@/components/neighbor/SolidarityWallView"
import { CommunityMapView } from "@/components/neighbor/CommunityMapView"
import { EmergencySOSView } from "@/components/neighbor/EmergencySOSView"
import { BusinessDetailModal } from "@/components/neighbor/BusinessDetailModal"
import { LoadError } from "@/components/ui/load-error"
import {
  CreatePostModal,
  EmergencyKindValue,
  NewPostData,
  PostTypeSelection,
  PublishResult,
} from "@/components/neighbor/CreatePostModal"

interface DashboardViewProps {
  user: User
  onLogout: () => void
  onOpenPanel?: () => void
}

type LoadStatus = "loading" | "ready" | "error"

const LIVE_CHECK_MS = 20000

const TAB_IDS: AppTab[] = ["inicio", "mapa", "muro", "emergencia"]

function tabFromUrl(): AppTab {
  const tab = new URLSearchParams(window.location.search).get("tab")
  return TAB_IDS.find(t => t === tab) ?? "inicio"
}

function tabUrl(tab: AppTab): string {
  return tab === "inicio" ? "/" : `/?tab=${tab}`
}

function modeChanged(prev: EmergencyMode | null, next: EmergencyMode): boolean {
  return !prev || prev.active !== next.active || prev.activatedAt !== next.activatedAt || prev.title !== next.title
}

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "mapa", label: "Mapa", icon: Map },
  { id: "muro", label: "Muro solidario", icon: Heart },
]

export function DashboardView({ user, onLogout, onOpenPanel }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AppTab>(tabFromUrl)
  const { catalog, error: catalogError, retry: retryCatalog } = useCatalog()
  const location = useMemo(() => ({ lat: user.location.lat, lng: user.location.lng }), [user.location.lat, user.location.lng])
  const neighborhoodName = user.location.neighborhood

  const [favors, setFavors] = useState<FavorItem[]>([])
  const [wallStatus, setWallStatus] = useState<LoadStatus>("loading")
  const [wallReloadKey, setWallReloadKey] = useState(0)

  const [emergency, setEmergency] = useState<EmergencyOverview | null>(null)
  const [emergencyOrigin, setEmergencyOrigin] = useState<EmergencyOrigin>("home")
  const [herePoint, setHerePoint] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateFailed, setLocateFailed] = useState(false)
  const [detailItem, setDetailItem] = useState<MapItem | null>(null)
  const emergencyFrom = useMemo(
    () => (emergencyOrigin === "here" && herePoint ? herePoint : location),
    [emergencyOrigin, herePoint, location]
  )
  const [emergencyStatus, setEmergencyStatus] = useState<LoadStatus>("loading")
  const [emergencyReloadKey, setEmergencyReloadKey] = useState(0)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [directoryKey, setDirectoryKey] = useState(0)
  const [mapKey, setMapKey] = useState(0)

  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [createInitialType, setCreateInitialType] = useState<PostTypeSelection>("necesito")
  const [createEmergencyKind, setCreateEmergencyKind] = useState<EmergencyKindValue>("NEED")
  const [createInitialText, setCreateInitialText] = useState("")
  const [kusiOpen, setKusiOpen] = useState(false)

  const [tutorialOpen, setTutorialOpen] = useState(tutorialRequested)
  const outbox = useOutbox()
  const [sendingOutbox, setSendingOutbox] = useState(false)
  const modeRef = useRef<EmergencyMode | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("tutorial")) window.history.replaceState(null, "", tabUrl(tabFromUrl()))
    const onPop = () => {
      const tab = tabFromUrl()
      if (tab === "emergencia") setEmergencyReloadKey(k => k + 1)
      setActiveTab(tab)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    modeRef.current = emergency?.mode ?? null
  }, [emergency])

  const sendOutbox = useCallback(async () => {
    if (outboxSnapshot().items.length === 0) return
    const sent = await flushOutbox()
    if (sent > 0) {
      setWallReloadKey(k => k + 1)
      setEmergencyReloadKey(k => k + 1)
      setDirectoryKey(k => k + 1)
      setMapKey(k => k + 1)
    }
  }, [])

  const sendOutboxNow = async () => {
    setSendingOutbox(true)
    try {
      await sendOutbox()
    } finally {
      setSendingOutbox(false)
    }
  }

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible") return
      void sendOutbox()
      if (activeTab === "emergencia") {
        setEmergencyReloadKey(k => k + 1)
        return
      }
      emergencyApi
        .mode()
        .then(next => {
          if (modeChanged(modeRef.current, next)) setEmergencyReloadKey(k => k + 1)
        })
        .catch(() => {})
    }
    const timer = window.setInterval(check, LIVE_CHECK_MS)
    document.addEventListener("visibilitychange", check)
    window.addEventListener("online", check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", check)
      window.removeEventListener("online", check)
    }
  }, [activeTab, sendOutbox])

  useEffect(() => {
    const timer = window.setTimeout(() => void sendOutbox(), 0)
    return () => window.clearTimeout(timer)
  }, [sendOutbox])

  const closeTutorial = useCallback(() => {
    markTutorialSeen()
    setTutorialOpen(false)
  }, [])

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
      .overview(emergencyFrom)
      .then(data => {
        if (cancelled) return
        setEmergency(data)
        setEmergencyStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setEmergencyStatus(current => (current === "ready" ? current : "error"))
      })
    return () => {
      cancelled = true
    }
  }, [emergencyReloadKey, emergencyFrom])

  useEffect(() => {
    let cancelled = false
    addressesApi
      .list()
      .then(list => {
        if (!cancelled) setAddresses(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const goTo = (tab: AppTab) => {
    if (tab === "emergencia") setEmergencyReloadKey(k => k + 1)
    if (tab !== activeTab) window.history.pushState(null, "", tabUrl(tab))
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

  const openCreate = (type: PostTypeSelection, kind: EmergencyKindValue = "NEED", text = "") => {
    setCreateInitialType(type)
    setCreateEmergencyKind(kind)
    setCreateInitialText(text)
    setModalKey(k => k + 1)
    setIsCreateModalOpen(true)
  }

  const handleRespond = (favor: FavorItem, message: string) =>
    postsApi.respond(favor.id, message || DEFAULT_RESPONSE[favor.type === "necesito" ? "REQUEST" : "OFFER"])

  const respondFromMap = (item: MapItem, message: string) =>
    postsApi.respond(String(item.id), message || DEFAULT_RESPONSE[item.type === "REQUEST" ? "REQUEST" : "OFFER"])

  const onTheWayFromMap = async (item: MapItem, message: string) => {
    await emergencyApi.onTheWay(item.id, message)
    setEmergencyReloadKey(k => k + 1)
  }

  const chooseEmergencyOrigin = (next: EmergencyOrigin) => {
    setLocateFailed(false)
    if (next === "home") {
      setEmergencyOrigin("home")
      return
    }
    setLocating(true)
    currentPosition()
      .then(point => {
        setHerePoint(point)
        setEmergencyOrigin("here")
      })
      .catch(() => setLocateFailed(true))
      .finally(() => setLocating(false))
  }

  const refreshAfterDetail = useCallback(() => {
    setMapKey(k => k + 1)
    setEmergencyReloadKey(k => k + 1)
    setWallReloadKey(k => k + 1)
  }, [])

  const modalCategories = useMemo<Record<PostTypeSelection, Option[]>>(
    () => ({
      necesito: catalog?.postCategories ?? [],
      ofrezco: catalog?.postCategories ?? [],
      recomiendo: (catalog?.businessCategories ?? []).map(c => ({ value: c.slug, label: c.name })),
      emergencia: catalog?.emergencyCategories ?? [],
    }),
    [catalog]
  )

  const handleCreatePost = async (data: NewPostData): Promise<PublishResult> => {
    try {
      return { message: await publish(data) }
    } catch (err) {
      if (!(err instanceof ApiError) || !err.queued) throw err
      return {
        queued: true,
        message:
          data.type === "emergencia"
            ? "Sin señal: guardamos tu alerta y se enviará sola apenas vuelva la conexión. Si es urgente, llama a los números de emergencia."
            : "Sin señal: guardamos tu publicación y se enviará sola cuando vuelva la conexión.",
      }
    }
  }

  const publish = async (data: NewPostData): Promise<string> => {
    if (data.type === "necesito" || data.type === "ofrezco") {
      const { favor, pending, reviewing } = await postsApi.create({
        type: data.type,
        category: data.category,
        categoryLabel: data.categoryLabel,
        text: data.details || data.description,
        reference: data.reference,
        where: data.where,
      })
      if (reviewing) return "¡Enviado! Lo estamos revisando y suele tardar unos segundos. Míralo en «Mi actividad», en el muro."
      if (pending) return "¡Enviado! Un moderador lo revisará y luego aparecerá en el muro."
      setFavors(prev => [favor, ...prev])
      setMapKey(k => k + 1)
      goTo("muro")
      return "¡Publicado en el barrio!"
    }

    if (data.type === "emergencia") {
      const title = data.reference
        ? `${data.description || data.categoryLabel} · Ref.: ${data.reference}`.slice(0, 150)
        : data.description || undefined
      await emergencyApi.report(
        {
          kind: data.emergencyKind,
          category: data.category,
          title,
          peopleCount: data.emergencyKind === "NEED" ? data.peopleCount : undefined,
          vulnerable: data.emergencyKind === "NEED" && data.vulnerable.length > 0 ? data.vulnerable : undefined,
          ...(data.where ?? {}),
        },
        title ?? `Emergencia: ${data.categoryLabel}`
      )
      setMapKey(k => k + 1)
      if (activeTab === "emergencia") reloadEmergency()
      else goTo("emergencia")
      return "¡Alerta enviada! Tus vecinos ya pueden verla."
    }

    const created = await businessesApi.create({
      name: data.description,
      categorySlug: data.category,
      phone: data.phone || undefined,
      reference: data.reference || undefined,
      opensAt: data.opensAt || undefined,
      closesAt: data.closesAt || undefined,
      openDays: data.openDays || undefined,
      recommendation: {
        goodPrice: data.tags.includes("goodPrice"),
        punctual: data.tags.includes("punctual"),
        reliable: data.tags.includes("reliable"),
        comment: data.comment || undefined,
      },
      ...(data.where ?? {}),
    })
    if (created.status === "PENDING") {
      return created.autoReview?.state === "QUEUED"
        ? "¡Gracias! Estamos revisando tu recomendación. Si todo está bien, aparecerá en unos segundos."
        : "¡Gracias! Un moderador revisará tu recomendación antes de publicarla."
    }
    setDirectoryKey(k => k + 1)
    setMapKey(k => k + 1)
    goTo("inicio")
    return "¡Recomendación publicada!"
  }

  const mode = emergency?.mode
  const assistantEnabled = !!catalog?.assistantEnabled
  const openKusi = useCallback(() => setKusiOpen(true), [])
  const closeKusi = useCallback(() => setKusiOpen(false), [])
  const draftFromKusi = (draft: KusiDraft) => openCreate(draft.type, "NEED", draft.text)

  const catalogFallback = catalogError ? (
    <LoadError onRetry={retryCatalog} />
  ) : (
    <div className="py-16 flex justify-center">
      <div className="size-7 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
    </div>
  )

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
              Emergencia
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            {onOpenPanel && (
              <button
                onClick={() => {
                  if (window.location.search) window.history.replaceState(null, "", "/")
                  onOpenPanel()
                }}
                className="h-9 px-3 rounded-xl border border-[#087F72] text-[#087F72] bg-white hover:bg-[#EAF5F1] text-xs font-bold flex items-center gap-1.5"
              >
                <Shield className="size-4" />
                <span className="hidden sm:inline">Panel de moderador</span>
                <span className="sm:hidden">Panel</span>
              </button>
            )}

            <button
              onClick={() => (assistantEnabled ? openKusi() : setTutorialOpen(true))}
              aria-label={assistantEnabled ? "Ayuda: pregúntale a Kusi" : "Cómo funciona Ayni"}
              title={assistantEnabled ? "Ayuda" : "Cómo funciona"}
              className="size-9 rounded-xl border border-gray-200 bg-white text-[#087F72] hover:border-[#087F72] flex items-center justify-center"
            >
              <CircleHelp className="size-4" />
            </button>

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
                <span className="text-xs text-gray-500">{neighborhoodName} · Mis direcciones</span>
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

      {outbox.items.length > 0 && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-900 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        >
          <span className="flex items-center gap-2 font-semibold">
            <WifiOff className="size-4 shrink-0" />
            {outbox.items.length === 1
              ? "1 publicación espera señal para enviarse"
              : `${outbox.items.length} publicaciones esperan señal para enviarse`}
          </span>
          <button
            onClick={sendOutboxNow}
            disabled={sendingOutbox}
            className="font-bold underline underline-offset-2 disabled:opacity-60"
          >
            {sendingOutbox ? "Enviando…" : "Enviar ahora"}
          </button>
        </div>
      )}

      {outbox.failed && (
        <div
          role="alert"
          className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-sm text-rose-800 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        >
          <span>
            No pudimos enviar «{outbox.failed.label}»: {outbox.failed.message}
          </span>
          <button onClick={() => setOutboxFailure(null)} className="font-bold underline underline-offset-2">
            Entendido
          </button>
        </div>
      )}

      {mode?.active && activeTab !== "emergencia" && (
        <button
          onClick={() => goTo("emergencia")}
          className="w-full bg-[#BA1A1A] text-white px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="size-4" />
          {emergency?.myCheckIn
            ? `Modo emergencia activo: ${mode.title}. Toca para ver reportes y puntos de apoyo.`
            : `Modo emergencia activo: ${mode.title}. Toca para contarnos si estás bien.`}
        </button>
      )}

      <main className="flex-1 px-4 sm:px-6 py-6 pb-28 md:pb-12 max-w-5xl mx-auto w-full">
        {activeTab === "inicio" &&
          (catalog ? (
            <DirectoryView
              userName={user.name}
              userNeighborhood={neighborhoodName}
              location={location}
              options={catalog.directory}
              refreshKey={directoryKey}
              onSelectBusiness={setSelectedBusinessId}
              onOpenMap={() => goTo("mapa")}
              onRecommendNew={() => openCreate("recomiendo")}
              onAskKusi={assistantEnabled ? openKusi : undefined}
            />
          ) : (
            catalogFallback
          ))}

        {activeTab === "mapa" &&
          (catalog ? (
            <CommunityMapView
              catalog={catalog}
              home={location}
              addresses={addresses}
              emergencyActive={!!mode?.active}
              refreshKey={mapKey + directoryKey}
              onSelectBusiness={setSelectedBusinessId}
              onRespondPost={respondFromMap}
              onOnTheWay={onTheWayFromMap}
              onOpenEmergency={() => goTo("emergencia")}
              onOpenDetail={setDetailItem}
            />
          ) : (
            catalogFallback
          ))}

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
            origin={emergencyOrigin}
            locating={locating}
            locateFailed={locateFailed}
            onChooseOrigin={chooseEmergencyOrigin}
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
          <span className="text-xs font-bold">Inicio</span>
        </button>
        <button
          onClick={() => goTo("mapa")}
          className={`flex flex-col items-center gap-1 ${activeTab === "mapa" ? "text-[#087F72]" : "text-gray-500"}`}
        >
          <Map className="size-5" />
          <span className="text-xs font-bold">Mapa</span>
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
          <span className="text-xs font-bold">Muro</span>
        </button>
        <button
          onClick={() => goTo("emergencia")}
          className={`flex flex-col items-center gap-1 ${activeTab === "emergencia" ? "text-[#BA1A1A]" : "text-gray-500"}`}
        >
          <AlertTriangle className="size-5" />
          <span className="text-xs font-bold">Emergencia</span>
        </button>
      </nav>

      {assistantEnabled && (
        <KusiChat
          open={kusiOpen}
          covered={selectedBusinessId !== null}
          firstName={user.name.split(" ")[0] || user.name}
          location={location}
          emergencyNumbers={catalog?.emergencyNumbers ?? []}
          onClose={closeKusi}
          onSelectBusiness={setSelectedBusinessId}
          onOpenWall={() => goTo("muro")}
          onOpenEmergency={() => goTo("emergencia")}
          onDraft={draftFromKusi}
          onOpenTutorial={() => setTutorialOpen(true)}
        />
      )}

      {detailItem && (
        <ItemDetailSheet
          item={detailItem}
          from={location}
          supportPoints={emergency?.supportPoints ?? []}
          approximateRadius={catalog?.map.approximateRadius ?? 0}
          onClose={() => setDetailItem(null)}
          onChanged={refreshAfterDetail}
        />
      )}

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
        initialText={createInitialText}
        addresses={addresses}
        home={location}
        mapStyleUrl={catalog?.map.styleUrl ?? null}
        categories={modalCategories}
        emergencyKinds={catalog?.emergencyKinds ?? []}
        emergencyNumbers={catalog?.emergencyNumbers ?? []}
        vulnerableGroups={catalog?.vulnerableGroups ?? []}
        recommendationTags={catalog?.recommendationTags ?? []}
        openDayOptions={catalog?.openDays ?? []}
        onSubmitPost={handleCreatePost}
      />

      <TutorialOverlay open={tutorialOpen} onClose={closeTutorial} />
    </div>
  )
}
