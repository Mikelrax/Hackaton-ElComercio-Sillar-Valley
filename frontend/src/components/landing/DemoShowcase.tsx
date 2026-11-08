"use client"

import * as React from "react"
import { Check, Pause, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { PhoneFrame } from "@/components/landing/PhoneFrame"
import { DEMOS, demoVideo, type DemoId } from "@/components/landing/demos"
import { useInView, useReducedMotion } from "@/components/landing/Reveal"

type DemoShowcaseProps = {
  active: DemoId
  onSelect: (id: DemoId) => void
}

export function DemoShowcase({ active, onSelect }: DemoShowcaseProps) {
  const index = Math.max(0, DEMOS.findIndex(d => d.id === active))
  const demo = DEMOS[index]
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const barRef = React.useRef<HTMLSpanElement>(null)
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const { ref: sectionRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0.25, rootMargin: "0px" })
  const reduced = useReducedMotion()
  const [choice, setChoice] = React.useState<boolean | null>(null)
  const [endedOn, setEndedOn] = React.useState<DemoId | null>(null)
  const paused = choice ?? reduced
  const ended = endedOn === active
  const setPaused = (next: boolean) => setChoice(next)

  React.useEffect(() => {
    if (barRef.current) barRef.current.style.transform = "scaleX(0)"
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-demo="${active}"]`)
    const strip = tabsRef.current
    if (tab && strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" })
    }
  }, [active])

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (inView && !paused) video.play().catch(() => setPaused(true))
    else video.pause()
  }, [inView, paused, active])

  React.useEffect(() => {
    if (!inView) return
    let frame = 0
    const tick = () => {
      const video = videoRef.current
      const bar = barRef.current
      if (video && bar && video.duration) bar.style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView])

  const select = (id: DemoId) => {
    setPaused(false)
    onSelect(id)
  }

  const onEnded = () => {
    if (paused) return
    if (index < DEMOS.length - 1) onSelect(DEMOS[index + 1].id)
    else setEndedOn(active)
  }

  const replay = () => {
    setEndedOn(null)
    setPaused(false)
    if (active === DEMOS[0].id && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    } else onSelect(DEMOS[0].id)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = DEMOS[(index + step + DEMOS.length) % DEMOS.length]
    select(next.id)
    tabsRef.current?.querySelector<HTMLElement>(`[data-demo="${next.id}"]`)?.focus()
  }

  const video = demoVideo(demo.id)

  return (
    <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-y-6 lg:gap-x-12">
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Demostraciones de Ayni"
        onKeyDown={onKeyDown}
        className="order-1 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-1 min-w-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 py-1 lg:py-0 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {DEMOS.map(d => {
          const selected = d.id === active
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              id={`demo-tab-${d.id}`}
              data-demo={d.id}
              aria-selected={selected}
              aria-controls="demo-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(d.id)}
              style={selected ? ({ "--tab-accent": d.accent, "--tab-soft": d.soft } as React.CSSProperties) : undefined}
              className={cn(
                "group relative shrink-0 snap-start overflow-hidden rounded-2xl border text-left transition-all duration-300 outline-none focus-visible:ring-3 focus-visible:ring-[#087F72]/40",
                selected
                  ? "border-[var(--tab-accent)]/30 bg-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)]"
                  : "border-transparent bg-white/60 hover:bg-white hover:border-border/80"
              )}
            >
              <span className="flex items-center gap-3 px-3.5 py-3 lg:px-4 lg:py-3.5">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300",
                    selected ? "scale-105" : "group-hover:scale-105"
                  )}
                  style={{ backgroundColor: d.soft, color: d.accent, borderColor: `${d.accent}33` }}
                >
                  <d.icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-[15px] font-bold whitespace-nowrap", selected ? "text-[#172B2A]" : "text-[#3f4b4a]")}>
                    {d.label}
                  </span>
                  <span className="hidden lg:block text-[13px] text-muted-foreground truncate">{d.title}</span>
                </span>
              </span>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-black/5">
                {selected && (
                  <span
                    ref={barRef}
                    className="block h-full origin-left"
                    style={{ backgroundColor: d.accent, transform: "scaleX(0)" }}
                  />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div
        id="demo-panel"
        role="tabpanel"
        aria-labelledby={`demo-tab-${demo.id}`}
        key={demo.id}
        className="order-3 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-2 self-start rounded-3xl border border-border/70 bg-white/80 p-6 backdrop-blur-sm ld-panel-in"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: demo.accent }}>
          {demo.label}
        </p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172B2A]">{demo.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{demo.description}</p>
        <ol className="mt-5 space-y-2.5">
          {demo.steps.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 text-[15px] text-[#26302f] ld-panel-in"
              style={{ animationDelay: `${120 + i * 110}ms`, animationFillMode: "both" }}
            >
              <span
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ backgroundColor: demo.accent }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="order-2 lg:order-none lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2 self-center relative flex justify-center py-6">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700 ld-glow"
          style={{ backgroundColor: `${demo.accent}26` }}
        />
        <svg aria-hidden viewBox="0 0 400 400" className="absolute top-1/2 left-1/2 w-[460px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 opacity-60 ld-spin">
          <circle cx="200" cy="200" r="190" fill="none" stroke={demo.accent} strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="4 10" />
          <circle cx="200" cy="10" r="5" fill={demo.accent} fillOpacity="0.5" />
          <circle cx="390" cy="200" r="4" fill="#F59E0B" fillOpacity="0.6" />
        </svg>

        <div className="relative">
          <PhoneFrame offline={demo.offline}>
            <video
              key={demo.id}
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover ld-screen-in"
              src={video.src}
              poster={video.poster}
              muted
              playsInline
              preload="auto"
              onEnded={onEnded}
              aria-label={`Video: ${demo.title}`}
            />
            {ended && (
              <button
                type="button"
                onClick={replay}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#172B2A]/55 text-white backdrop-blur-[2px]"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#087F72] shadow-lg">
                  <RotateCcw className="size-7" />
                </span>
                <span className="text-sm font-semibold">Ver de nuevo</span>
              </button>
            )}
          </PhoneFrame>

          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Reproducir video" : "Pausar video"}
            className="absolute -right-3 bottom-16 sm:-right-6 z-20 flex size-12 items-center justify-center rounded-full bg-white text-[#172B2A] shadow-[0_10px_30px_-10px_rgba(15,23,42,0.45)] ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            {paused ? <Play className="size-5 translate-x-px" /> : <Pause className="size-5" />}
          </button>

          {demo.offline && (
            <span
              key="offline-chip"
              className="absolute -left-4 sm:-left-14 top-24 z-20 flex items-center gap-2 rounded-2xl bg-[#1f2937] px-3.5 py-2.5 text-[13px] font-semibold text-white shadow-xl ld-bounce-in"
            >
              <span className="size-2 rounded-full bg-amber-400 text-amber-400 ld-pulse-dot" />
              Modo avión activado
            </span>
          )}

          <span
            key={`${demo.id}-badge`}
            className="absolute -left-4 sm:-left-16 bottom-24 z-20 hidden sm:flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#172B2A] shadow-[0_14px_34px_-14px_rgba(15,23,42,0.4)] ring-1 ring-black/5 ld-bounce-in"
            style={{ animationDelay: "250ms" }}
          >
            <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: demo.accent }}>
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            Grabado en la app real
          </span>
        </div>
      </div>
    </div>
  )
}
