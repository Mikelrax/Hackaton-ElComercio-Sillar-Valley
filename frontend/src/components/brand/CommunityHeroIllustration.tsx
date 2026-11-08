import * as React from "react"
import { Handshake, Siren, Star } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { cn } from "@/lib/utils"
import { Landing } from "@/lib/types"

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function CommunityHeroIllustration({ landing, className }: { landing: Landing | null; className?: string }) {
  const business = landing?.business
  const offer = landing?.offer
  const supportPoint = landing?.supportPoint
  return (
    <div className={cn("relative w-full max-w-lg mx-auto aspect-[4/3] flex items-center justify-center select-none", className)}>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-3xl blur-2xl -z-10" />

      <svg
        viewBox="0 0 520 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="sillarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="mintGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f0fdf4" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <circle cx="260" cy="190" r="160" fill="url(#skyGrad)" />
        <circle cx="260" cy="190" r="130" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 6" strokeOpacity="0.3" />

        <path
          d="M60 250 L160 170 L260 250 L360 160 L460 250"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.6"
        />

        <rect x="40" y="270" width="440" height="8" rx="4" fill="#e2e8f0" />
        <line x1="60" y1="285" x2="460" y2="285" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="12 12" />

        <g transform="translate(70, 160)">
          <rect x="0" y="30" width="100" height="80" rx="6" fill="url(#sillarGrad)" stroke="#cbd5e1" strokeWidth="2" />
          <polygon points="0,30 50,0 100,30" fill="#047857" />
          <path d="M5 35 Q 25 45 50 35 Q 75 45 95 35" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
          <rect x="15" y="65" width="25" height="45" rx="3" fill="#059669" />
          <rect x="55" y="60" width="30" height="30" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="25" y="15" width="50" height="14" rx="3" fill="#10b981" />
          <text x="50" y="25" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">BODEGA</text>
        </g>

        <g transform="translate(200, 110)">
          <rect x="0" y="40" width="120" height="120" rx="8" fill="url(#sillarGrad)" stroke="#cbd5e1" strokeWidth="2" />
          <polygon points="0,40 60,10 120,40" fill="#059669" />
          <rect x="25" y="20" width="35" height="15" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" transform="skewX(-15)" />
          <rect x="20" y="60" width="22" height="25" rx="3" fill="#fef08a" stroke="#cbd5e1" />
          <rect x="78" y="60" width="22" height="25" rx="3" fill="#fef08a" stroke="#cbd5e1" />
          <rect x="20" y="100" width="22" height="25" rx="3" fill="#e2e8f0" stroke="#cbd5e1" />
          <rect x="78" y="100" width="22" height="25" rx="3" fill="#e2e8f0" stroke="#cbd5e1" />
          <rect x="47" y="115" width="26" height="45" rx="4" fill="#0f172a" />
          <line x1="60" y1="10" x2="60" y2="-15" stroke="#059669" strokeWidth="2.5" />
          <circle cx="60" cy="-15" r="4" fill="#10b981" />
          <path d="M50 -20 A15 15 0 0 1 70 -20" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M42 -27 A25 25 0 0 1 78 -27" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
        </g>

        <g transform="translate(350, 150)">
          <rect x="0" y="35" width="95" height="85" rx="6" fill="url(#sillarGrad)" stroke="#cbd5e1" strokeWidth="2" />
          <polygon points="0,35 48,5 95,35" fill="#0f766e" />
          <rect x="18" y="60" width="26" height="26" rx="4" fill="#bae6fd" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="55" y="70" width="24" height="50" rx="3" fill="#334155" />
          <rect x="14" y="82" width="34" height="6" rx="2" fill="#f43f5e" />
        </g>

        <g transform="translate(170, 200)">
          <rect x="12" y="45" width="8" height="25" fill="#78350f" rx="2" />
          <circle cx="16" cy="35" r="22" fill="#10b981" />
          <circle cx="24" cy="25" r="16" fill="#34d399" />
        </g>

        <g transform="translate(330, 205)">
          <line x1="5" y1="0" x2="5" y2="65" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="5" cy="0" r="4" fill="#facc15" />
          <path d="M-2 0 Q 5 -8 12 0" fill="none" stroke="#64748b" strokeWidth="2" />
        </g>

        {business && (
          <g transform="translate(30, 60)">
            <g className="animate-bounce" style={{ animationDuration: "5s", transformBox: "fill-box" }}>
              <rect x="0" y="0" width="172" height="42" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
              <circle cx="22" cy="21" r="13" fill="#d1fae5" />
              <DynamicIcon name={business.categoryIcon as IconName} x={15} y={14} size={14} color="#059669" strokeWidth={2.25} />
              <text x="42" y="18" fill="#0f172a" fontSize="10" fontWeight="bold">{clip(business.name, 22)}</text>
              <Star x={42} y={23} size={8} color="#059669" fill="#059669" />
              <text x="53" y="30" fill="#059669" fontSize="8.5" fontWeight="600">
                {business.recommendations === 1 ? "Recomendado por 1 vecino" : `Recomendado por ${business.recommendations} vecinos`}
              </text>
            </g>
          </g>
        )}

        {offer && (
          <g transform="translate(318, 70)">
            <g className="animate-bounce" style={{ animationDuration: "6s", transformBox: "fill-box" }}>
              <rect x="0" y="0" width="176" height="42" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
              <circle cx="22" cy="21" r="13" fill="#e0f2fe" />
              <Handshake x={15} y={14} size={14} color="#0284c7" strokeWidth={2.25} />
              <text x="42" y="18" fill="#0f172a" fontSize="10" fontWeight="bold">{clip(offer.title, 23)}</text>
              <text x="42" y="30" fill="#0284c7" fontSize="8.5" fontWeight="600">
                {clip([offer.neighborhood, "Sin costo"].filter(Boolean).join(" · "), 28)}
              </text>
            </g>
          </g>
        )}

        {supportPoint && (
          <g transform="translate(170, 290)">
            <rect x="0" y="0" width="180" height="34" rx="10" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
            <circle cx="18" cy="17" r="10" fill="#ffe4e6" />
            <Siren x={12} y={11} size={12} color="#e11d48" strokeWidth={2.25} />
            <text x="35" y="16" fill="#9f1239" fontSize="9" fontWeight="bold">{clip(supportPoint.name, 27)}</text>
            <text x="35" y="26" fill="#64748b" fontSize="8">
              {clip(`${supportPoint.typeLabel} · ${supportPoint.neighborhood}`, 34)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
