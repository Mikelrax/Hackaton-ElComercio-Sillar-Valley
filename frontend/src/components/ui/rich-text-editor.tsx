"use client"

import dynamic from "next/dynamic"

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  maxLength?: number
  label: string
  minHeight?: number
}

export const RichTextEditor = dynamic<RichTextEditorProps>(() => import("@/components/ui/rich-text-editor-impl"), {
  ssr: false,
  loading: () => <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" aria-hidden="true" />,
})
