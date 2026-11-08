"use client"

import { useEffect, useState } from "react"
import { authService, User } from "@/lib/auth"
import { LandingView } from "@/components/landing/LandingView";
import { ModeratorDashboard } from "@/components/dashboard/ModeratorDashboard";
import { DashboardView } from "@/components/dashboard/DashboardView"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentUser(authService.getCurrentUser())
  }, [])

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
  }

  // Prevenir parpadeo durante hidratación inicial
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (currentUser) {
    // Moderador ve su panel propio
    if (currentUser.role === "moderador") {
      return <ModeratorDashboard user={currentUser} onLogout={handleLogout} />;
    }
    return <DashboardView user={currentUser} onLogout={handleLogout} />;
  }

  return <LandingView />
}
