"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  HandHeart,
  HandHelping,
  Handshake,
  MapPin,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Smartphone,
  Star,
  Store,
  WifiOff,
  type LucideIcon,
} from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/Logo"
import { CommunityHeroIllustration } from "@/components/brand/CommunityHeroIllustration"
import { PhoneFrame } from "@/components/landing/PhoneFrame"
import { DemoShowcase } from "@/components/landing/DemoShowcase"
import { CountUp, Reveal, useInView } from "@/components/landing/Reveal"
import { demoVideo, type DemoId } from "@/components/landing/demos"
import "@/components/landing/landing.css"
import { apiFetch } from "@/lib/api"
import { APP_URL, appUrl } from "@/lib/hosts"
import { Landing } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Feature {
  id: string
  demo: DemoId
  icon: LucideIcon
  title: string
  tag: string
  body: React.ReactNode
  footer: string
  card: string
  iconBox: string
  accent: string
  divider: string
  glow: string
}

const FEATURES: Feature[] = [
  {
    id: "directorio",
    demo: "directorio",
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
    glow: "rgb(8 127 114 / 0.13)",
  },
  {
    id: "solidaridad",
    demo: "muro",
    icon: HandHelping,
    title: "Muro solidario",
    tag: "Sin dinero de por medio",
    body: "Préstamo de herramientas, donación de útiles escolares, trueque de habilidades y acompañamiento a adultos mayores, sin intermediarios ni pagos.",
    footer: "Publicaciones «Necesito» y «Ofrezco»",
    card: "border-border/80 bg-card",
    iconBox: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
    accent: "text-[#B45309]",
    divider: "border-border/60",
    glow: "rgb(245 158 11 / 0.16)",
  },
  {
    id: "emergencias",
    demo: "emergencia",
    icon: ShieldAlert,
    title: "Modo emergencia",
    tag: "Cuando más se necesita",
    body: "Ante sismos, huaycos o cortes de agua, la junta vecinal activa el modo emergencia: reportes de quien necesita ayuda, puntos de apoyo y coordinación entre vecinos en tiempo real.",
    footer: "Lo activa la junta vecinal",
    card: "border-[#BA1A1A]/25 bg-rose-50/40",
    iconBox: "bg-rose-100 text-[#BA1A1A] border-[#BA1A1A]/20",
    accent: "text-[#BA1A1A]",
    divider: "border-[#BA1A1A]/15",
    glow: "rgb(186 26 26 / 0.12)",
  },
]

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: CheckCircle2, label: "Sin comisiones" },
  { icon: WifiOff, label: "Funciona sin internet" },
  { icon: ShieldCheck, label: "Moderado por tu junta vecinal" },
]

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Smartphone,
    title: "Tu nombre y tu celular",
    body: "Te registras en tres pasos desde el celular, sin correos ni formularios largos.",
  },
  {
    icon: MapPin,
    title: "Marca tu casa en el mapa",
    body: "Así ves lo que está cerca y tus vecinos saben que eres del barrio.",
  },
  {
    icon: HandHeart,
    title: "Pide, ofrece y recomienda",
    body: "Publicar toma pocos toques y la junta vecinal modera para que todo sea confiable.",
  },
]

const NAV = [
  { href: "#demo", label: "Demo" },
  { href: "#como-funciona", label: "Funciones" },
  { href: "#empezar", label: "Cómo empezar" },
]

function useScrollProgress() {
  const barRef = React.useRef<HTMLSpanElement>(null)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
      setScrolled(window.scrollY > 8)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  return { barRef, scrolled }
}

function HeroVideo() {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0.1, rootMargin: "0px" })
  const video = demoVideo("tour")

  React.useEffect(() => {
    const node = videoRef.current
    if (!node) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (inView && !reduced) node.play().catch(() => {})
    else node.pause()
  }, [inView])

  return (
    <div ref={ref} className="absolute inset-0">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Recorrido por la app Ayni: directorio, muro solidario, mapa, Kusi y emergencias"
      />
    </div>
  )
}

function FloatingCard({ children, className, motion }: { children: React.ReactNode; className?: string; motion: string }) {
  return (
    <div className={cn("absolute z-20", className)}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-3 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur",
          motion
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function LandingView() {
  const [landing, setLanding] = React.useState<Landing | null>(null)
  const [demo, setDemo] = React.useState<DemoId>("directorio")
  const { barRef, scrolled } = useScrollProgress()

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

  const watch = (id: DemoId) => {
    setDemo(id)
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const zones = landing?.zones ?? []
  const ticker = zones.length > 0 ? Array.from({ length: Math.max(2, Math.ceil(10 / zones.length)) }, () => zones).flat() : []
  const appHost = new URL(APP_URL).host

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFCFB] text-foreground antialiased overflow-x-clip">
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled ? "border-b border-border/70 bg-white/80 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="#inicio" aria-label="Ayni, ir al inicio">
            <Logo size="md" />
          </a>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground" aria-label="Secciones">
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="relative rounded-lg px-3 py-2 hover:text-foreground transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-[#087F72] after:transition-transform hover:after:scale-x-100"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href={appUrl("/login")}>
              <Button variant="ghost" size="sm" className="font-semibold text-sm h-10 px-3 rounded-xl">
                Iniciar sesión
              </Button>
            </a>
            <a href={appUrl("/registro")}>
              <Button size="sm" className="group bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-sm h-10 px-4 rounded-xl shadow-sm gap-1.5">
                <span>Registrarme</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </a>
          </div>
        </div>
        <span
          ref={barRef}
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-[#087F72] via-[#0ea5a4] to-[#F59E0B]"
          style={{ transform: "scaleX(0)" }}
        />
      </header>

      <section id="inicio" className="relative -mt-16 pt-24 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-0 pointer-events-none">
          <div className="ld-blob-a -top-24 -left-24 size-[520px]" />
          <div className="ld-blob-b top-1/3 -right-32 size-[460px]" />
          <div className="ld-blob-c bottom-0 left-1/3 size-[380px]" />
          <div className="ld-dots absolute inset-0" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <p
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#087F72]/25 text-[#075E54] text-sm font-semibold shadow-sm backdrop-blur ld-bounce-in"
              >
                <span className="size-2 rounded-full bg-[#10b981] text-[#10b981] ld-pulse-dot" />
                <MapPin className="size-4 text-[#087F72]" />
                Para vecinos de Arequipa
              </p>

              <h1
                className="text-4xl sm:text-5xl lg:text-[58px] xl:text-6xl font-extrabold tracking-tight text-[#172B2A] leading-[1.08] ld-bounce-in"
                style={{ animationDelay: "90ms" }}
              >
                Tu barrio conectado, <br className="hidden sm:inline" />
                <span className="relative inline-block">
                  <span className="ld-gradient-text">solidario y seguro</span>
                  <svg aria-hidden viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full ld-underline">
                    <path d="M3 11 C 70 3, 150 3, 297 9" fill="none" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p
                className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed ld-bounce-in"
                style={{ animationDelay: "180ms" }}
              >
                Encuentra productos y servicios recomendados por tus vecinos cerca de casa, intercambia favores y
                herramientas sin dinero, y coordina ayuda inmediata ante cualquier emergencia.
              </p>

              <div
                className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start ld-bounce-in"
                style={{ animationDelay: "270ms" }}
              >
                <a href={appUrl("/registro")}>
                  <Button
                    className="group w-full sm:w-auto h-12 px-7 rounded-xl bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-base shadow-[0_12px_28px_-12px_rgba(8,127,114,0.8)] gap-2 transition-all hover:-translate-y-0.5 ld-shine"
                  >
                    <span>Unirme a mi barrio</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <a href="#demo">
                  <Button
                    variant="outline"
                    className="group w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-base border-border bg-white/80 hover:bg-white gap-2 transition-all hover:-translate-y-0.5"
                  >
                    <PlayCircle className="size-5 text-[#087F72] transition-transform group-hover:scale-110" />
                    <span>Ver la app en acción</span>
                  </Button>
                </a>
              </div>

              <ul
                className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-sm text-muted-foreground font-medium ld-bounce-in"
                style={{ animationDelay: "360ms" }}
              >
                {HIGHLIGHTS.map(h => (
                  <li key={h.label} className="flex items-center gap-1.5">
                    <h.icon className="size-4 text-[#087F72]" />
                    {h.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <svg aria-hidden viewBox="0 0 400 260" className="absolute top-1/2 left-1/2 w-[560px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 opacity-70">
                <g className="ld-spin" style={{ transformOrigin: "150px 130px" }}>
                  <circle cx="150" cy="130" r="112" fill="none" stroke="#087F72" strokeOpacity="0.22" strokeWidth="14" />
                </g>
                <g className="ld-spin-reverse" style={{ transformOrigin: "250px 130px" }}>
                  <circle cx="250" cy="130" r="112" fill="none" stroke="#F59E0B" strokeOpacity="0.22" strokeWidth="14" strokeDasharray="40 18" />
                </g>
              </svg>

              <div className="relative ld-bounce-in" style={{ animationDelay: "200ms" }}>
                <div className="ld-float">
                  <PhoneFrame className="w-[min(268px,70vw)] sm:w-[288px]">
                    <HeroVideo />
                  </PhoneFrame>
                </div>

                {landing?.business && (
                  <FloatingCard className="-left-6 sm:-left-28 lg:-left-16 xl:-left-24 top-[24%]" motion="ld-float-alt">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#EAF5F1]">
                      <DynamicIcon name={landing.business.categoryIcon as IconName} className="size-5 text-[#087F72]" />
                    </span>
                    <span className="min-w-0 max-w-[170px]">
                      <span className="block truncate text-[13px] font-bold text-[#172B2A]">{landing.business.name}</span>
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-[#087F72]">
                        <Star className="size-3 fill-current" />
                        {landing.business.recommendations === 1
                          ? "Recomendado por 1 vecino"
                          : `Recomendado por ${landing.business.recommendations} vecinos`}
                      </span>
                    </span>
                  </FloatingCard>
                )}

                {landing?.offer && (
                  <FloatingCard className="hidden sm:block -right-28 top-[50%]" motion="ld-float-slow">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#E0F2FE]">
                      <Handshake className="size-5 text-[#0284c7]" />
                    </span>
                    <span className="min-w-0 max-w-[170px]">
                      <span className="block truncate text-[13px] font-bold text-[#172B2A]">{landing.offer.title}</span>
                      <span className="block truncate text-[12px] font-semibold text-[#0284c7]">
                        {[landing.offer.neighborhood, "Sin costo"].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </FloatingCard>
                )}

                {landing?.supportPoint && (
                  <FloatingCard className="-right-4 sm:-left-20 lg:-left-12 xl:-left-20 sm:right-auto bottom-[12%]" motion="ld-float">
                    <span className="relative flex size-10 items-center justify-center rounded-xl bg-[#FFE4E6]">
                      <span className="absolute inset-0 rounded-xl border-2 border-[#e11d48]/40 ld-ring" />
                      <Siren className="size-5 text-[#e11d48]" />
                    </span>
                    <span className="min-w-0 max-w-[170px]">
                      <span className="block truncate text-[13px] font-bold text-[#9f1239]">{landing.supportPoint.name}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {landing.supportPoint.typeLabel} · {landing.supportPoint.neighborhood}
                      </span>
                    </span>
                  </FloatingCard>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {ticker.length > 0 && (
        <section aria-label="Barrios con vecinos activos" className="relative border-y border-border/60 bg-white/70 py-4 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <span className="shrink-0 flex items-center gap-2 text-sm font-semibold text-[#172B2A]">
              <span className="size-2 rounded-full bg-[#10b981] text-[#10b981] ld-pulse-dot" />
              Vecinos activos en
            </span>
            <div className="relative w-full overflow-hidden ld-marquee-mask">
              <div className="ld-marquee">
                {[0, 1].map(copy => (
                  <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-2 pr-2">
                    {ticker.map((district, i) => (
                      <li
                        key={`${copy}-${i}`}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-white px-3 py-1.5 text-[13px] font-medium text-[#3f4b4a]"
                      >
                        <MapPin className="size-3.5 text-[#087F72]" />
                        {district}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-14">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { node: <CountUp to={3} />, label: "pasos para pedir u ofrecer un favor" },
            { node: <CountUp to={0} prefix="S/ " />, label: "de comisión, para siempre" },
            { node: <CountUp to={4} />, label: "números de emergencia a un toque" },
            ...(zones.length > 0 ? [{ node: <CountUp to={zones.length} />, label: zones.length === 1 ? "barrio con vecinos activos" : "barrios con vecinos activos" }] : []),
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className="w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]">
              <div className="h-full rounded-2xl border border-border/70 bg-white p-5 text-center shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)] transition-transform duration-300 hover:-translate-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#087F72]">{stat.node}</p>
                <p className="mt-1 text-[13px] sm:text-sm leading-snug text-muted-foreground">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="demo" className="scroll-mt-16 relative py-20 sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-0 bg-gradient-to-b from-transparent via-[#EAF5F1]/70 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#087F72] shadow-sm ring-1 ring-[#087F72]/15">
              <PlayCircle className="size-4" />
              Mírala en acción
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B2A]">Así se usa Ayni en el celular</h2>
            <p className="text-base text-muted-foreground">
              Videos grabados en la app real con una cuenta de prueba. Elige qué quieres ver o deja que avancen solos.
            </p>
          </Reveal>
          <DemoShowcase active={demo} onSelect={setDemo} />
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-16 py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <Reveal className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <p className="text-sm font-semibold text-[#087F72]">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B2A]">Tres herramientas, un solo barrio</h2>
          <p className="text-base text-muted-foreground">
            Para el día a día y para cuando más se necesita: en una emergencia, Ayni se convierte en un mapa de ayuda.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.id} delay={i * 120} as="article" className="h-full">
              <div
                id={f.id}
                onPointerMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`)
                  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`)
                }}
                style={{ "--glow": f.glow } as React.CSSProperties}
                className={cn(
                  "group scroll-mt-20 h-full rounded-2xl border p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]",
                  "ld-spotlight",
                  f.card
                )}
              >
                <div className="space-y-4">
                  <span
                    className={cn(
                      "size-12 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6",
                      f.iconBox
                    )}
                  >
                    <f.icon className="size-6" />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold tracking-tight text-[#172B2A]">{f.title}</h3>
                    <p className={cn("text-xs font-semibold uppercase tracking-wider", f.accent)}>{f.tag}</p>
                  </div>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
                <div className={cn("pt-4 border-t flex items-center justify-between gap-3", f.divider)}>
                  <p className={cn("text-sm font-medium", f.accent)}>{f.footer}</p>
                  <button
                    type="button"
                    onClick={() => watch(f.demo)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                      f.accent
                    )}
                  >
                    <PlayCircle className="size-4" />
                    Ver video
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <StepsSection />

      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <Reveal from="zoom">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#087F72] via-[#0b7268] to-[#075E54] text-white shadow-[0_40px_80px_-40px_rgba(7,94,84,0.9)]">
            <svg aria-hidden viewBox="0 0 400 260" className="absolute -right-24 -top-20 w-[520px] opacity-20">
              <g className="ld-spin" style={{ transformOrigin: "150px 130px" }}>
                <circle cx="150" cy="130" r="100" fill="none" stroke="#ffffff" strokeWidth="18" />
              </g>
              <g className="ld-spin-reverse" style={{ transformOrigin: "250px 130px" }}>
                <circle cx="250" cy="130" r="100" fill="none" stroke="#F59E0B" strokeWidth="18" strokeDasharray="50 22" />
              </g>
            </svg>
            <div className="ld-dots absolute inset-0 opacity-30" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12">
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Sé parte activa del cuidado de tu barrio</h2>
                <p className="text-[#EAF5F1] text-base sm:text-lg max-w-xl mx-auto lg:mx-0">
                  Únete hoy a Ayni y fortalece los lazos de confianza, apoyo mutuo y seguridad en tu comunidad.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a href={appUrl("/registro")}>
                    <Button
                      className="group w-full sm:w-auto h-12 px-8 rounded-xl bg-white text-[#087F72] hover:bg-[#EAF5F1] font-bold text-base shadow-md gap-2 transition-transform hover:-translate-y-0.5 ld-shine"
                    >
                      Empezar ahora
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </a>
                  <a href={appUrl("/login")}>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto h-12 px-6 rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold text-base"
                    >
                      Ya tengo cuenta
                    </Button>
                  </a>
                </div>
                <p className="flex items-start justify-center lg:justify-start gap-2 text-sm text-[#CFEDE6]">
                  <Smartphone className="size-4 mt-0.5 shrink-0" />
                  <span>
                    Instálala como app: abre <strong className="font-semibold text-white">{appHost}</strong> en tu celular y elige
                    «Agregar a la pantalla de inicio».
                  </span>
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-white/95 p-3 shadow-xl ring-1 ring-white/40">
                  <CommunityHeroIllustration landing={landing} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border/80 bg-white py-8 text-sm text-muted-foreground">
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

function StepsSection() {
  const { ref, inView } = useInView<HTMLOListElement>()
  return (
    <section id="empezar" className="scroll-mt-16 py-16 sm:py-20 bg-white border-y border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <p className="text-sm font-semibold text-[#087F72]">Cómo empezar</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172B2A]">Empieza en tres pasos</h2>
          <p className="text-base text-muted-foreground">Sin descargas obligatorias: funciona desde el navegador y se instala como app.</p>
        </Reveal>

        <ol ref={ref} className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          <span aria-hidden className="hidden md:block absolute top-7 left-[16.6%] right-[16.6%] h-[3px] rounded-full bg-[#087F72]/10">
            <span
              className="block h-full origin-left rounded-full bg-gradient-to-r from-[#087F72] to-[#F59E0B] transition-transform duration-[1600ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
              style={{ transform: inView ? "scaleX(1)" : "scaleX(0)", transitionDelay: "300ms" }}
            />
          </span>
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                "relative flex flex-col items-center text-center transition-all duration-700 motion-reduce:transition-none",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${200 + i * 350}ms` }}
            >
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white text-[#087F72] shadow-[0_12px_30px_-14px_rgba(8,127,114,0.6)] ring-1 ring-[#087F72]/20">
                <step.icon className="size-6" />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-[#F59E0B] text-[12px] font-bold text-white ring-2 ring-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-bold text-[#172B2A]">{step.title}</h3>
              <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>

        <Reveal className="mt-12 flex justify-center" delay={200}>
          <a href={appUrl("/registro")}>
            <Button className="group h-12 px-7 rounded-xl bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-base gap-2 shadow-[0_12px_28px_-12px_rgba(8,127,114,0.8)] transition-transform hover:-translate-y-0.5">
              Crear mi cuenta gratis
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
