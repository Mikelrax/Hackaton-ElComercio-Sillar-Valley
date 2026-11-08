"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function useInView<T extends Element>(options: { once?: boolean; rootMargin?: string; threshold?: number } = {}) {
  const { once = true, rootMargin = "0px 0px -12% 0px", threshold = 0.15 } = options
  const ref = React.useRef<T | null>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}

type RevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  from?: "up" | "left" | "right" | "zoom"
  as?: "div" | "li" | "article" | "section"
}

const HIDDEN: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate-y-8",
  left: "-translate-x-8",
  right: "translate-x-8",
  zoom: "scale-95",
}

export function Reveal({ children, className, delay = 0, from = "up", as = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>()
  const Tag = as as React.ElementType
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100",
        inView ? "opacity-100 translate-x-0 translate-y-0 scale-100" : cn("opacity-0", HIDDEN[from]),
        className
      )}
    >
      {children}
    </Tag>
  )
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

export function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  )
}

export function CountUp({ to, duration = 1400, prefix = "", suffix = "" }: { to: number; duration?: number; prefix?: string; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const reduced = useReducedMotion()
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (!inView || reduced) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, to, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {reduced ? to : value}
      {suffix}
    </span>
  )
}
