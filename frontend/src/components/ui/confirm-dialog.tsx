"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"
import { ShieldAlert } from "lucide-react"
import { useDialog } from "@/lib/use-dialog"

export interface ConfirmSpec {
  title: string
  body?: string
  warning?: string
  tone?: "teal" | "red"
  confirmLabel: string
  cancelLabel?: string
  message?: {
    label: string
    initial?: string
    placeholder?: string
    maxLength?: number
  }
}

type Pending = ConfirmSpec & { id: number; resolve: (value: string | null) => void }

const TONES = {
  teal: "bg-[#087F72] hover:bg-[#075E54]",
  red: "bg-[#BA1A1A] hover:bg-[#9B1414]",
}

function ConfirmDialog({ spec, onAnswer }: { spec: Pending; onAnswer: (value: string | null) => void }) {
  const [message, setMessage] = useState(spec.message?.initial ?? "")
  const ref = useRef<HTMLDivElement>(null)
  const cancel = useCallback(() => onAnswer(null), [onAnswer])
  useDialog(true, ref, cancel)

  return (
    <div
      onClick={cancel}
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`confirm-title-${spec.id}`}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl px-5 pt-6 pb-6 sm:p-7 space-y-4"
      >
        <h2 id={`confirm-title-${spec.id}`} className="text-[22px] font-bold leading-tight text-[#1C1917]">
          {spec.title}
        </h2>
        {spec.body && <p className="text-[17px] leading-snug text-[#44403C]">{spec.body}</p>}
        {spec.warning && (
          <p className="flex items-start gap-2 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-3.5 text-[15px] leading-snug text-[#78350F]">
            <ShieldAlert className="size-5 mt-0.5 shrink-0" aria-hidden="true" />
            {spec.warning}
          </p>
        )}
        {spec.message && (
          <label className="block space-y-2">
            <span className="block text-[15px] font-semibold text-[#1C1917]">{spec.message.label}</span>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={spec.message.maxLength ?? 200}
              placeholder={spec.message.placeholder}
              className="w-full rounded-2xl border-2 border-[#E7E5E4] bg-white p-3.5 text-[17px] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#087F72] resize-none"
            />
          </label>
        )}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={cancel}
            className="h-14 rounded-2xl border-2 border-[#E7E5E4] text-[17px] font-bold text-[#44403C] hover:bg-gray-50"
          >
            {spec.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            autoFocus={!spec.message}
            onClick={() => onAnswer(message.trim())}
            className={`h-14 rounded-2xl text-white text-[17px] font-bold ${TONES[spec.tone ?? "teal"]}`}
          >
            {spec.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)
  const counter = useRef(0)

  const ask = useCallback(
    (spec: ConfirmSpec) =>
      new Promise<string | null>(resolve => {
        counter.current += 1
        setPending({ ...spec, id: counter.current, resolve })
      }),
    []
  )

  const answer = useCallback(
    (value: string | null) => {
      pending?.resolve(value)
      setPending(null)
    },
    [pending]
  )

  const dialog = pending ? <ConfirmDialog key={pending.id} spec={pending} onAnswer={answer} /> : null
  return { ask, dialog }
}
