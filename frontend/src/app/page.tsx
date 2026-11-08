"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { authService, parseSession, sessionSnapshot, subscribeSession } from "@/lib/auth"
import { LoginScreen } from "@/components/auth/LoginScreen"
import { ModeratorDashboard } from "@/components/dashboard/ModeratorDashboard"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default function Home() {
  const raw = useSyncExternalStore<string | null | undefined>(subscribeSession, sessionSnapshot, () => undefined)
  const currentUser = useMemo(() => (raw === undefined ? null : parseSession(raw)), [raw])
  const [neighborView, setNeighborView] = useState(false)

  const handleLogout = () => {
    setNeighborView(false)
    authService.logout()
  }

  if (raw === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (currentUser) {
    const moderator = currentUser.role === "moderador"
    if (moderator && !neighborView) {
      return (
        <ModeratorDashboard
          user={currentUser}
          onLogout={handleLogout}
          onOpenNeighborView={() => setNeighborView(true)}
        />
      )
    }

    return (
      <DashboardView
        user={currentUser}
        onLogout={handleLogout}
        onOpenPanel={moderator ? () => setNeighborView(false) : undefined}
      />
    )
  }

  return <LoginScreen />
}
