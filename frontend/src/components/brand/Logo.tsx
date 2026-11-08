import * as React from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  withSubtitle?: boolean
}

export function Logo({
  className,
  size = "md",
  withSubtitle = false,
}: LogoProps) {
  const imageSizes = {
    sm: { width: 34, height: 24, text: "text-lg" },
    md: { width: 44, height: 30, text: "text-xl" },
    lg: { width: 56, height: 38, text: "text-2xl" },
  }

  const current = imageSizes[size]

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 72 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            size === "sm" ? "w-8 h-5" : size === "md" ? "w-10 h-6" : "w-14 h-8"
          )}
        >
          <circle
            cx="24"
            cy="22"
            r="16"
            stroke="#087F72"
            strokeWidth="7"
            fill="none"
          />
          <circle
            cx="48"
            cy="22"
            r="16"
            stroke="#F59E0B"
            strokeWidth="7"
            fill="none"
          />
          <path
            d="M 33 11 A 16 16 0 0 1 33 33"
            stroke="#087F72"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span className={cn("font-black tracking-tight text-[#172B2A]", current.text)}>
            Ayni
          </span>
        </div>
        {withSubtitle && (
          <span className="text-[10px] font-medium text-gray-500 mt-0.5">
            Conectamos vecinos, compartimos soluciones
          </span>
        )}
      </div>
    </div>
  )
}
