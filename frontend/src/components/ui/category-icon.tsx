"use client"

import * as React from "react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { Circle } from "lucide-react"

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  return (
    <DynamicIcon
      name={name as IconName}
      className={className}
      aria-hidden="true"
      fallback={() => <Circle className={className} aria-hidden="true" />}
    />
  )
}

const PALETTE = [
  "bg-teal-100 text-teal-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-lime-100 text-lime-800",
]

export function categoryTone(slug: string): string {
  let hash = 0
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
