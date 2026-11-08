"use client"

import * as React from "react"
import { BatteryFull, Plane, Signal, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

const CLOCK = new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit", hour12: false, timeZone: "America/Lima" })

function subscribeClock(onChange: () => void) {
  const id = window.setInterval(onChange, 15000)
  return () => window.clearInterval(id)
}

function useClock() {
  return React.useSyncExternalStore(
    subscribeClock,
    () => CLOCK.format(new Date()),
    () => ""
  )
}

type PhoneFrameProps = {
  children: React.ReactNode
  className?: string
  offline?: boolean
  tone?: "dark" | "light"
}

export function PhoneFrame({ children, className, offline = false, tone = "dark" }: PhoneFrameProps) {
  const time = useClock()
  return (
    <div className={cn("relative mx-auto w-[min(296px,76vw)] select-none", className)}>
      <span aria-hidden className="absolute -left-[3px] top-[18%] h-10 w-[3px] rounded-l-md bg-[#1f2a29]" />
      <span aria-hidden className="absolute -left-[3px] top-[28%] h-16 w-[3px] rounded-l-md bg-[#1f2a29]" />
      <span aria-hidden className="absolute -right-[3px] top-[24%] h-20 w-[3px] rounded-r-md bg-[#1f2a29]" />
      <div
        className={cn(
          "relative rounded-[2.9rem] p-[9px] shadow-[0_40px_80px_-24px_rgba(7,94,84,0.45),0_18px_36px_-18px_rgba(15,23,42,0.45)] ring-1",
          tone === "dark" ? "bg-gradient-to-b from-[#26302f] to-[#0c1211] ring-black/30" : "bg-gradient-to-b from-white to-[#e7ecea] ring-black/10"
        )}
      >
        <div className="relative overflow-hidden rounded-[2.35rem] bg-white">
          <div className="relative z-10 flex h-[30px] items-center justify-between bg-white px-6 text-[11px] font-semibold text-[#111827]">
            <span className="tabular-nums w-10">{time}</span>
            <span aria-hidden className="absolute left-1/2 top-[7px] h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1" aria-hidden>
              {offline ? (
                <Plane className="size-3.5" strokeWidth={2.5} />
              ) : (
                <>
                  <Signal className="size-3.5" strokeWidth={2.5} />
                  <Wifi className="size-3.5" strokeWidth={2.5} />
                </>
              )}
              <BatteryFull className="size-4" strokeWidth={2} />
            </span>
          </div>
          <div className="relative aspect-[390/844] w-full overflow-hidden bg-[#F7F8F8]">{children}</div>
          <span aria-hidden className="pointer-events-none absolute bottom-[6px] left-1/2 z-10 h-[4px] w-[34%] -translate-x-1/2 rounded-full bg-black/75" />
        </div>
      </div>
    </div>
  )
}
