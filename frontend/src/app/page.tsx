"use client"

import { useEffect, useState } from "react"
import { authService, User } from "@/lib/auth"
import { LandingView } from "@/components/landing/LandingView"
import { ModeratorDashboard } from "@/components/dashboard/ModeratorDashboard"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [neighborView, setNeighborView] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentUser(authService.getCurrentUser())
  }, [])

  const handleLogout = () => {
    authService.logout()
    setNeighborView(false)
    setCurrentUser(null)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
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

  return <LandingView />
}
