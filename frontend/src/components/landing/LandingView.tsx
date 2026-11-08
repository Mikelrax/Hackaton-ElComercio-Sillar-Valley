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
  Star,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Users2,
  HeartHandshake,
  Clock,
  Radio,
  Share2,
  AlertTriangle,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/Logo"
import { CommunityHeroIllustration } from "@/components/brand/CommunityHeroIllustration"
import { apiFetch } from "@/lib/api"
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
  previewBadge: string
  previewContent: React.ReactNode
}

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: CheckCircle2, label: "Sin comisiones ni intermediarios" },
  { icon: WifiOff, label: "Funciona sin internet (Modo Offline)" },
  { icon: ShieldCheck, label: "Moderado por tu junta vecinal" },
]

const STATS = [
  { value: "+450", label: "Vecinos conectados", sub: "en Arequipa" },
  { value: "S/ 0", label: "Comisiones cobradas", sub: "100% solidario" },
  { value: "< 5 min", label: "Respuesta comunitaria", sub: "ante emergencias" },
  { value: "100%", label: "Comercios locales", sub: "recomendados por vecinos" },
]

const COMPARISONS = [
  {
    feature: "Privacidad de tu número",
    chat: "Tu celular expuesto a cientos de desconocidos en grupos públicos",
    ayni: "Contacto verificado solo cuando tú decides responder o coordinar",
  },
  {
    feature: "Búsqueda de servicios",
    chat: "Mensajes perdidos entre decenas de memes, cadenas y spam",
    ayni: "Directorio organizado por rubro, distancia y recomendaciones reales",
  },
  {
    feature: "Ayuda y solidaridad",
    chat: "Difícil saber quién necesita qué o si la ayuda ya fue atendida",
    ayni: "Muro con filtros «Necesito» y «Ofrezco» que se actualiza al resolverse",
  },
  {
    feature: "En emergencias (sismo/corte)",
    chat: "Pánico y desinformación sin canales oficiales",
    ayni: "Modo Emergencia activado por tu junta vecinal con mapa de puntos de apoyo",
  },
]

const FAQS = [
  {
    q: "¿Tiene algún costo registrar mi negocio o usar Ayni?",
    a: "No, Ayni es una plataforma cívica 100% gratuita. No cobra comisiones por ventas, suscripciones ni publicidad. El objetivo es fortalecer la economía local y la red de ayuda del barrio.",
  },
  {
    q: "¿Qué sucede si se corta el internet durante un temblor o desastre?",
    a: "Ayni incluye almacenamiento local en tu dispositivo (PWA). Podrás consultar los contactos de emergencia, puntos de acopio y guías de auxilio guardadas previamente sin necesidad de señal.",
  },
  {
    q: "¿Quién vigila que no haya estafas o contenido inapropiado?",
    a: "Las juntas vecinales acreditadas actúan como moderadores activos del barrio. Cuentan con herramientas para pausar publicaciones, emitir claves temporales y validar a vecinos reales.",
  },
  {
    q: "¿Cómo contacto a un comerciante o vecino solidario?",
    a: "Directamente por WhatsApp con un solo clic o mediante el número registrado, sin algoritmos ni pasarelas de pago intermediarias.",
  },
]

export function LandingView() {
  const [landing, setLanding] = React.useState<Landing | null>(null)
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)

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

  const FEATURES: Feature[] = [
    {
      id: "directorio",
      icon: Store,
      title: "Directorio del barrio",
      tag: "Día a día · cerca de casa",
      body: (
        <>
          Bodegas, panaderías, gasfiteros y costureras recomendados por vecinos de tu misma zona. En vez de estrellas
          falsas: <em>«Recomendado por vecinos reales»</em>.
        </>
      ),
      footer: "Contacto directo por WhatsApp · Sin comisiones",
      card: "border-teal-500/20 bg-card hover:border-[#087F72]/50 hover:shadow-xl hover:shadow-[#087F72]/5",
      iconBox: "bg-[#EAF5F1] text-[#087F72] border-[#087F72]/20",
      accent: "text-[#087F72]",
      divider: "border-teal-500/15",
      previewBadge: "Comercio de confianza",
      previewContent: (
        <div className="rounded-xl border border-border/80 bg-background/95 p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#EAF5F1] text-[#087F72] flex items-center justify-center font-bold text-sm shrink-0">
                🍞
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">Panadería & Pastelería Don Lucho</p>
                <p className="text-[11px] text-muted-foreground">Calle San Jerónimo 214 · Yanahuara</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
              Abierto
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#087F72]">
              <Star className="size-3 fill-[#087F72] text-[#087F72]" />
              18 recomendaciones de vecinos
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
              <MessageCircle className="size-3 text-emerald-600" />
              WhatsApp
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "solidaridad",
      icon: HandHelping,
      title: "Muro solidario",
      tag: "Sin dinero de por medio",
      body: "Préstamo de herramientas, donación de útiles escolares, trueque de habilidades y acompañamiento a adultos mayores, sin intermediarios ni pagos.",
      footer: "Publicaciones «Necesito» y «Ofrezco» · 100% solidario",
      card: "border-amber-500/20 bg-card hover:border-[#B45309]/50 hover:shadow-xl hover:shadow-amber-500/5",
      iconBox: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
      accent: "text-[#B45309]",
      divider: "border-amber-500/15",
      previewBadge: "Apoyo mutuo",
      previewContent: (
        <div className="rounded-xl border border-border/80 bg-background/95 p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide uppercase">
              Ofrezco Préstamo
            </span>
            <span className="text-[10px] text-muted-foreground">Hace 2 horas</span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Escalera de aluminio 4m y taladro percutor</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              Para arreglos en casa este fin de semana. Sin costo, solo devolver cuidada.
            </p>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Carlos M. · Vecino hace 3 años</span>
            <span className="text-amber-700 font-semibold">🤝 3 vecinos respondieron</span>
          </div>
        </div>
      ),
    },
    {
      id: "emergencias",
      icon: ShieldAlert,
      title: "Modo emergencia",
      tag: "Cuando más se necesita",
      body: "Ante sismos, huaycos o cortes imprevistos de agua, la junta vecinal activa el modo emergencia: reportes en vivo, puntos de apoyo y auxilio coordinado.",
      footer: "Activado por la junta vecinal · Datos clave sin internet",
      card: "border-[#BA1A1A]/25 bg-rose-50/40 hover:border-[#BA1A1A]/50 hover:shadow-xl hover:shadow-rose-500/5",
      iconBox: "bg-rose-100 text-[#BA1A1A] border-[#BA1A1A]/20",
      accent: "text-[#BA1A1A]",
      divider: "border-[#BA1A1A]/15",
      previewBadge: "Alerta vecinal activa",
      previewContent: (
        <div className="rounded-xl border border-rose-300 bg-white p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold tracking-wide uppercase">
              <span className="size-1.5 rounded-full bg-white animate-ping" />
              Alerta Activa
            </span>
            <span className="text-[10px] font-semibold text-rose-700">Corte de Agua</span>
          </div>
          <div>
            <p className="text-xs font-bold text-rose-950">Punto de Acopio y Cisterna Municipal</p>
            <p className="text-[11px] text-rose-800">
              📍 Parque Principal Yanahuara · Llegada de cisterna a las 4:30 PM.
            </p>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-rose-100 text-[11px]">
            <span className="font-semibold text-rose-700">Reportar adulto mayor</span>
            <span className="text-rose-900 font-bold">24 familias notificadas</span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-[#087F72]/20 selection:text-[#087F72]">
      {/* ================= BARRA SUPERIOR ================= */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground" aria-label="Secciones">
            <a href="#como-funciona" className="hover:text-[#087F72] transition-colors">
              Cómo funciona
            </a>
            <a href="#impacto" className="hover:text-[#087F72] transition-colors">
              Impacto
            </a>
            <a href="#comparativa" className="hover:text-[#087F72] transition-colors">
              ¿Por qué Ayni?
            </a>
            <a href="#preguntas" className="hover:text-[#087F72] transition-colors">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-sm h-10 px-3.5 rounded-xl hover:text-[#087F72]">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-[#087F72] hover:bg-[#075E54] text-white font-semibold text-sm h-10 px-4 rounded-xl shadow-sm gap-1.5 transition-all active:scale-98">
                <span>Registrarme</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(#087F72_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5F1] border border-[#087F72]/25 text-[#075E54] text-sm font-semibold shadow-xs">
                <MapPin className="size-4 text-[#087F72]" />
                Red Cívica Vecinal · Arequipa
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
                Tu barrio conectado, <br className="hidden sm:inline" />
                <span className="text-[#087F72] bg-gradient-to-r from-[#087F72] to-[#0d9488] bg-clip-text text-transparent">
                  solidario y seguro
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Encuentra comercios y servicios recomendados por tus propios vecinos, intercambia favores y
                herramientas sin dinero de por medio, y coordina auxilio inmediato ante cualquier emergencia.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/registro">
                  <Button className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#087F72] hover:bg-[#075E54] text-white font-bold text-base shadow-md shadow-[#087F72]/20 gap-2 transition-all active:scale-98">
                    <span>Unirme a mi barrio gratis</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-base border-border hover:bg-muted/80 gap-2">
                    <Search className="size-4 text-[#087F72]" />
                    <span>Ver cómo funciona</span>
                  </Button>
                </a>
              </div>

              <ul className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2.5 gap-x-6 text-sm text-muted-foreground font-medium">
                {HIGHLIGHTS.map(h => (
                  <li key={h.label} className="flex items-center gap-2">
                    <span className="p-0.5 rounded-full bg-[#EAF5F1] text-[#087F72]">
                      <h.icon className="size-3.5" />
                    </span>
                    <span>{h.label}</span>
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

      {/* ================= BARRIOS ACTIVOS ================= */}
      {landing && landing.zones.length > 0 && (
        <section className="py-4 bg-[#F8FAFC] border-b border-border/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                <MapPin className="size-4 text-[#087F72]" />
                Barrios con vecinos organizados:
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
                {landing.zones.map(district => (
                  <span key={district} className="px-2.5 py-1 rounded-lg bg-white border border-border/70 text-xs font-semibold text-foreground/80 shadow-2xs">
                    {district}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= ESTADÍSTICAS / IMPACTO ================= */}
      <section id="impacto" className="py-12 bg-white border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label} className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#087F72] tracking-tight">{s.value}</p>
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= LAS 3 HERRAMIENTAS (TARJETAS MEJORADAS) ================= */}
      <section id="como-funciona" className="scroll-mt-16 py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <p className="text-sm font-bold uppercase tracking-wider text-[#087F72]">Arquitectura Cívica</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tres herramientas, un solo barrio</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Diseñadas tanto para la economía del día a día como para la protección mutua cuando ocurre una emergencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(f => (
            <article
              key={f.id}
              id={f.id}
              className={`scroll-mt-20 rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 ${f.card}`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className={`size-12 rounded-2xl flex items-center justify-center border shadow-xs ${f.iconBox}`}>
                    <f.icon className="size-6" />
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border bg-background/80 ${f.accent} border-current/20`}>
                    {f.previewBadge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{f.title}</h3>
                  <p className={`text-xs font-bold uppercase tracking-wider ${f.accent}`}>{f.tag}</p>
                </div>

                <p className="text-[14px] text-muted-foreground leading-relaxed">{f.body}</p>

                {/* Previsualización visual interactiva del módulo */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-500" />
                    Vista en vivo en la app:
                  </div>
                  {f.previewContent}
                </div>
              </div>

              <p className={`pt-4 border-t text-xs font-semibold ${f.divider} ${f.accent}`}>
                {f.footer}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= ¿POR QUÉ AYNI ES DIFERENTE? ================= */}
      <section id="comparativa" className="py-16 sm:py-20 bg-muted/40 border-y border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <p className="text-sm font-bold uppercase tracking-wider text-[#087F72]">Confianza Vecinal</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">¿Por qué no usar solo grupos de chat?</h2>
            <p className="text-base text-muted-foreground">
              Los chats vecinales se llenan de spam, desinformación y exponen tu número. Ayni ordena tu barrio con reglas claras.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-background overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 bg-muted/60 border-b border-border text-xs sm:text-sm font-bold py-3.5 px-4 sm:px-6">
              <div className="col-span-4 sm:col-span-3 text-foreground">Aspecto</div>
              <div className="col-span-4 sm:col-span-4 text-muted-foreground flex items-center gap-1.5">
                <XCircle className="size-4 text-rose-500 shrink-0" />
                <span>Grupos tradicionales</span>
              </div>
              <div className="col-span-4 sm:col-span-5 text-[#087F72] flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#087F72] shrink-0" />
                <span>Ayni Comunidad</span>
              </div>
            </div>

            <div className="divide-y divide-border/60 text-xs sm:text-sm">
              {COMPARISONS.map(row => (
                <div key={row.feature} className="grid grid-cols-12 py-4 px-4 sm:px-6 items-center gap-2 hover:bg-muted/20 transition-colors">
                  <div className="col-span-4 sm:col-span-3 font-semibold text-foreground">
                    {row.feature}
                  </div>
                  <div className="col-span-4 sm:col-span-4 text-muted-foreground text-xs sm:text-sm pr-2">
                    {row.chat}
                  </div>
                  <div className="col-span-4 sm:col-span-5 text-foreground font-medium text-xs sm:text-sm">
                    {row.ayni}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PREGUNTAS FRECUENTES ================= */}
      <section id="preguntas" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-[#087F72]">Resolvemos tus dudas</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-base text-muted-foreground">
            Todo lo que necesitas saber sobre cómo participar y cuidar a tu vecindario.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-foreground text-base sm:text-lg hover:text-[#087F72] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="size-5 text-[#087F72] shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`size-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-[#087F72]" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/20">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ================= BANNER FINAL DE LLAMADO A LA ACCIÓN ================= */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 w-full text-center">
        <div className="relative overflow-hidden p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#087F72] via-[#075E54] to-[#043E38] text-white shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
            <HeartHandshake className="size-4" />
            Red Solidaria de Arequipa
          </span>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Sé parte activa del cuidado de tu barrio
          </h2>

          <p className="text-teal-50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Únete hoy a Ayni. Conoce a los comerciantes de tu cuadra, comparte recursos y ayuda a proteger a tu vecindario.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registro">
              <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white text-[#087F72] hover:bg-teal-50 font-bold text-base shadow-lg transition-all active:scale-98">
                Crear mi cuenta gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold text-base border-white/30 text-white hover:bg-white/10">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border/80 bg-background py-10 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <Logo size="sm" />
            <p className="text-xs sm:text-sm">
              © 2026 Ayni · Plataforma Cívica Barrial de Arequipa
            </p>
            <div className="flex items-center gap-5 font-medium">
              <Link href="/privacidad" className="flex items-center gap-1.5 hover:text-foreground hover:underline transition-colors">
                <ShieldCheck className="size-4 text-[#087F72]" />
                Privacidad
              </Link>
              <Link href="/reglas" className="hover:text-foreground hover:underline transition-colors">
                Reglas del Barrio
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
