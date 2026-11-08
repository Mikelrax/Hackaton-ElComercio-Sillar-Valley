import * as React from "react"
import { cn } from "@/lib/utils"

export function SoftBackdrop({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-gradient-to-b from-emerald-50/60 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-10"
      />
      <div className={cn("relative z-10 min-h-dvh w-full", className)}>{children}</div>
    </div>
  )
}
