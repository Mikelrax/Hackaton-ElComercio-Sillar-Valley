"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { ArrowLeft, HeartHandshake, Plus, Search, WifiOff, type LucideIcon } from "lucide-react"
import { useDialog } from "@/lib/use-dialog"

const SEEN_KEY = "ayni_tutorial_seen"

export function tutorialRequested(): boolean {
  if (typeof window === "undefined") return false
  try {
    return new URLSearchParams(window.location.search).has("tutorial") || localStorage.getItem(SEEN_KEY) !== "1"
  } catch {
    return false
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1")
  } catch {}
}

interface Step {
  icon: LucideIcon
  tone: string
  title: string
  body: string
  tip?: { icon: LucideIcon; text: string }
}

const STEPS: Step[] = [
  {
    icon: Search,
    tone: "bg-[#CCFBF1] text-[#087F72]",
    title: "Busca cerca de tu casa",
    body: "En Inicio encuentras gasfiteros, bodegas, costureras y más, recomendados por vecinos de tu barrio. Toca uno para llamarlo o escribirle por WhatsApp.",
  },
  {
    icon: Plus,
    tone: "bg-[#FEF3C7] text-[#B45309]",
    title: "Publica en 3 toques",
    body: "Toca el botón + para pedir un favor, ofrecer algo, recomendar un negocio o avisar una emergencia. Eliges qué es, lo cuentas en pocas palabras y listo.",
    tip: { icon: WifiOff, text: "Si no tienes señal, lo guardamos y se envía solo cuando vuelva." },
  },
  {
    icon: HeartHandshake,
    tone: "bg-[#CCFBF1] text-[#087F72]",
    title: "Ayuda y recibe ayuda",
    body: "En el Muro respondes «Yo te ayudo» a quien lo necesita. Si hay una emergencia, en Emergencia ves quién necesita ayuda, los puntos de apoyo y los números para llamar.",
  },
]

export function TutorialOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const close = () => {
    setIndex(0)
    onClose()
  }
  useDialog(open, dialogRef, close)

  if (!open) return null

  const step = STEPS[index]
  const last = index === STEPS.length - 1
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl px-5 pt-5 pb-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#57534E]" aria-live="polite">
            Paso {index + 1} de {STEPS.length}
          </p>
          <button
            type="button"
            onClick={close}
            className="h-10 px-3 rounded-xl text-[15px] font-semibold text-[#57534E] hover:bg-gray-100"
          >
            Saltar
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <span className={`size-24 rounded-full flex items-center justify-center ${step.tone}`}>
            <Icon className="size-12" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <h2 id="tutorial-title" className="text-[26px] font-bold tracking-tight leading-tight text-[#1C1917]">
            {step.title}
          </h2>
          <p className="text-[17px] leading-snug text-[#44403C]">{step.body}</p>
          {step.tip && (
            <p className="w-full flex items-start gap-2 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-3.5 text-left text-[15px] leading-snug text-[#78350F]">
              <step.tip.icon className="size-5 mt-0.5 shrink-0" aria-hidden="true" />
              {step.tip.text}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-2" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-[#087F72]" : "w-2 bg-[#E7E5E4]"}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(i => i - 1)}
              aria-label="Paso anterior"
              className="size-14 shrink-0 rounded-2xl border-2 border-[#E7E5E4] flex items-center justify-center text-[#1C1917] hover:border-[#087F72]"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? close() : setIndex(i => i + 1))}
            className="flex-1 h-14 rounded-2xl bg-[#087F72] hover:bg-[#075E54] text-white text-[17px] font-bold transition-colors"
          >
            {last ? "Empezar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  )
}
