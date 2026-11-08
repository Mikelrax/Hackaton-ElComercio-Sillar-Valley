"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  HandHelping,
  ShieldAlert,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Store,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/brand/Logo"
import { CommunityHeroIllustration } from "@/components/brand/CommunityHeroIllustration"
import { apiFetch } from "@/lib/api"
import { Landing } from "@/lib/types"

export function LandingView() {
  const [landing, setLanding] = React.useState<Landing | null>(null)

  React.useEffect(() => {
    let cancelled = false
    apiFetch<Landing>("/api/landing", { auth: false })
      .then(data => {
        if (!cancelled) setLanding(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#directorio" className="hover:text-foreground transition-colors">
              Directorio
            </a>
            <a href="#solidaridad" className="hover:text-foreground transition-colors">
              Muro Solidario
            </a>
            <a href="#emergencias" className="hover:text-foreground transition-colors">
              Red SOS
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-xs h-9 px-3.5 rounded-xl">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-sm shadow-emerald-600/25 gap-1.5">
                <span>Registrarme</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="size-3.5 text-emerald-600" />
                <span>Plataforma Cívica de Resiliencia y Economía Barrial</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Tu barrio conectado, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  solidario y seguro
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Encuentra productos y servicios recomendados a 5 minutos a pie, intercambia favores y herramientas sin dinero, y coordina ayuda comunitaria inmediata ante cualquier emergencia.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/registro">
                  <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 gap-2">
                    <span>Unirme a mi Barrio</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-sm border-border hover:bg-muted/80 gap-2">
                    <Search className="size-4 text-emerald-600" />
                    <span>Ver cómo funciona</span>
                  </Button>
                </a>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>100% Sin Comisiones</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff className="size-4 text-emerald-600" />
                  <span>Funciona sin Internet (Offline)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Moderado por tu junta vecinal</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <CommunityHeroIllustration landing={landing} />
            </div>
          </div>
        </div>
      </section>

      {landing && landing.zones.length > 0 && (
      <section className="py-5 bg-muted/40 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-emerald-600" />
              Barrios con vecinos activos:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {landing.zones.map((district) => (
                <span
                  key={district}
                  className="px-2.5 py-1 rounded-lg bg-background border border-border/70 text-[11px] font-medium"
                >
                  {district}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      <section id="como-funciona" className="scroll-mt-16 py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            Arquitectura Cívica
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Una plataforma, dos modos para la comunidad
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Diseñada para impulsar la economía local en el día a día y proteger a las familias ante situaciones críticas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="directorio" className="scroll-mt-20 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <Store className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Directorio a 5 Minutos</h3>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
                  Modo Cotidiano · Radio Cercano
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gasfiteros, bodegas, técnicos y costureras avalados por vecinos reales de tu cuadra. Calificación transparente: <em>«Recomendado por 14 vecinos»</em> en lugar de estrellas dudosas.
              </p>
            </div>
            <p className="pt-4 border-t border-border/60 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Contacto directo por WhatsApp
            </p>
          </div>

          <div id="solidaridad" className="scroll-mt-20 rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <HandHelping className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Muro Solidario y Favores</h3>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Economía Colaborativa a Costo Cero
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Préstamo de herramientas (escaleras, taladros), donación de materiales escolares, trueque de habilidades y acompañamiento para adultos mayores sin intermediarios de dinero.
              </p>
            </div>
            <p className="pt-4 border-t border-border/60 text-xs text-blue-700 dark:text-blue-300 font-medium">
              Publicaciones «Necesito» u «Ofrezco»
            </p>
          </div>

          <div id="emergencias" className="scroll-mt-20 rounded-2xl border border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Red de Alerta SOS</h3>
                <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">
                  Resiliencia Comunitaria
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ante sismos, huaycos o cortes de agua, la plataforma se transforma en un mapa de auxilio: reportes de personas vulnerables, puntos de agua potable y coordinación vecinal en tiempo real.
              </p>
            </div>
            <p className="pt-4 border-t border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-medium">
              Activación comunitaria inmediata
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 w-full text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#087F72] via-[#075E54] to-teal-900 text-white shadow-xl shadow-[#087F72]/15 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Sé parte activa del cuidado de tu barrio
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Únete hoy a AYNI y fortalece los lazos de confianza, apoyo mutuo y seguridad en tu comunidad.
          </p>
          <div className="pt-3 flex flex-wrap gap-3 justify-center">
            <Link href="/registro">
              <Button className="h-12 px-8 rounded-xl bg-white text-[#087F72] hover:bg-emerald-50 font-bold text-sm shadow-md">
                Empezar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/80 bg-background py-8 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Logo size="sm" withSubtitle={false} />
          <p>© 2026 AYNI · Plataforma Cívica Comunitaria.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <WifiOff className="size-3 text-[#087F72]" />
              Soporte Offline PWA
            </span>
            <Link href="/privacidad" className="flex items-center gap-1 hover:text-foreground hover:underline">
              <ShieldCheck className="size-3 text-[#087F72]" />
              Privacidad
            </Link>
            <Link href="/reglas" className="hover:text-foreground hover:underline">
              Reglas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
