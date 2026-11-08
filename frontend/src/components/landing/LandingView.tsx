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
  WifiOff,
  Store,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/Logo"
import { CommunityHeroIllustration } from "@/components/brand/CommunityHeroIllustration"
import { apiFetch } from "@/lib/api"
import { appUrl } from "@/lib/hosts"
import { Landing } from "@/lib/types"

interface Feature {
  id: string
  icon: LucideIcon
  title: string
  tag: string
  body: React.ReactNode
  footer: string
  card: string
  iconBox: string
  accent: string
  divider: string
}

const FEATURES: Feature[] = [
  {
    id: "directorio",
    icon: Store,
    title: "Directorio del barrio",
    tag: "Día a día · cerca de casa",
    body: (
      <>
        Gasfiteros, bodegas, técnicos y costureras recomendados por vecinos reales de tu barrio. En vez de estrellas
        dudosas: <em>«Recomendado por 14 vecinos»</em>.
      </>
    ),
    footer: "Contacto directo por WhatsApp",
    card: "border-border/80 bg-card",
    iconBox: "bg-[#EAF5F1] text-[#087F72] border-[#087F72]/20",
    accent: "text-[#087F72]",
    divider: "border-border/60",
  },
  {
    id: "solidaridad",
    icon: HandHelping,
    title: "Muro solidario",
    tag: "Sin dinero de por medio",
    body: "Préstamo de herramientas, donación de útiles escolares, trueque de habilidades y acompañamiento a adultos mayores, sin intermediarios ni pagos.",
    footer: "Publicaciones «Necesito» y «Ofrezco»",
    card: "border-border/80 bg-card",
    iconBox: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
    accent: "text-[#B45309]",
    divider: "border-border/60",
  },
  {
    id: "emergencias",
    icon: ShieldAlert,
    title: "Modo emergencia",
    tag: "Cuando más se necesita",
    body: "Ante sismos, huaycos o cortes de agua, la junta vecinal activa el modo emergencia: reportes de quien necesita ayuda, puntos de apoyo y coordinación entre vecinos en tiempo real.",
    footer: "Lo activa la junta vecinal",
    card: "border-[#BA1A1A]/25 bg-rose-50/40",
    iconBox: "bg-rose-100 text-[#BA1A1A] border-[#BA1A1A]/20",
    accent: "text-[#BA1A1A]",
    divider: "border-[#BA1A1A]/15",
  },
]

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: CheckCircle2, label: "Sin comisiones" },
  { icon: WifiOff, label: "Funciona sin internet" },
  { icon: ShieldCheck, label: "Moderado por tu junta vecinal" },
]

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
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground" aria-label="Secciones">
            {FEATURES.map(f => (
              <a key={f.id} href={`#${f.id}`} className="hover:text-foreground transition-colors">
                {f.title}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a href={appUrl("/login")}>
              <Button variant="ghost" size="sm" className="font-semibold text-sm h-10 px-3.5 rounded-xl">
                Iniciar sesión
              </Button>
            </a>
            <a href={appUrl("/registro")}>
              <Button size="sm" className="bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-sm h-10 px-4 rounded-xl shadow-sm gap-1.5">
                <span>Registrarme</span>
                <ArrowRight className="size-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(#087F72_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5F1] border border-[#087F72]/25 text-[#075E54] text-sm font-semibold">
                <MapPin className="size-4 text-[#087F72]" />
                Para vecinos de Arequipa
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Tu barrio conectado, <br className="hidden sm:inline" />
                <span className="text-[#087F72]">solidario y seguro</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Encuentra productos y servicios recomendados por tus vecinos cerca de casa, intercambia favores y
                herramientas sin dinero, y coordina ayuda inmediata ante cualquier emergencia.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href={appUrl("/registro")}>
                  <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-base shadow-md gap-2">
                    <span>Unirme a mi barrio</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
                <a href="#como-funciona">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-base border-border hover:bg-muted/80 gap-2">
                    <Search className="size-4 text-[#087F72]" />
                    <span>Ver cómo funciona</span>
                  </Button>
                </a>
              </div>

              <ul className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-sm text-muted-foreground font-medium">
                {HIGHLIGHTS.map(h => (
                  <li key={h.label} className="flex items-center gap-1.5">
                    <h.icon className="size-4 text-[#087F72]" />
                    {h.label}
                  </li>
                ))}
              </ul>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-4 text-[#087F72]" />
                Barrios con vecinos activos:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {landing.zones.map(district => (
                  <span key={district} className="px-2.5 py-1 rounded-lg bg-background border border-border/70 text-xs font-medium">
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
          <p className="text-sm font-semibold text-[#087F72]">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tres herramientas, un solo barrio</h2>
          <p className="text-base text-muted-foreground">
            Para el día a día y para cuando más se necesita: en una emergencia, Ayni se convierte en un mapa de ayuda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <article
              key={f.id}
              id={f.id}
              className={`scroll-mt-20 rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${f.card}`}
            >
              <div className="space-y-4">
                <span className={`size-12 rounded-xl flex items-center justify-center border ${f.iconBox}`}>
                  <f.icon className="size-6" />
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${f.accent}`}>{f.tag}</p>
                </div>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
              <p className={`pt-4 border-t text-sm font-medium ${f.divider} ${f.accent}`}>{f.footer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#087F72] to-[#075E54] text-white shadow-xl space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Sé parte activa del cuidado de tu barrio</h2>
          <p className="text-[#EAF5F1] text-base max-w-xl mx-auto">
            Únete hoy a Ayni y fortalece los lazos de confianza, apoyo mutuo y seguridad en tu comunidad.
          </p>
          <div className="pt-3 flex flex-wrap gap-3 justify-center">
            <a href={appUrl("/registro")}>
              <Button className="h-12 px-8 rounded-xl bg-white text-[#087F72] hover:bg-[#EAF5F1] font-bold text-base shadow-md">
                Empezar ahora
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/80 bg-background py-8 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Logo size="sm" />
          <p>© 2026 Ayni · Red comunitaria de Arequipa</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="flex items-center gap-1 hover:text-foreground hover:underline">
              <ShieldCheck className="size-4 text-[#087F72]" />
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
