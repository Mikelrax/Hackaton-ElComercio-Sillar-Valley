"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.core.css"
import { Bold, Eraser, Italic, List, ListOrdered, Underline, type LucideIcon } from "lucide-react"
import { normalizeHtml, toPlainText } from "@/lib/rich-text"
import type { RichTextEditorProps } from "@/components/ui/rich-text-editor"

const FORMATS = ["bold", "italic", "underline", "list"]
const INLINE = ["bold", "italic", "underline"]

const MODULES = {
  toolbar: false,
  history: { userOnly: true },
  keyboard: {
    bindings: {
      tab: null,
      indent: null,
      outdent: null,
      "outdent backspace": null,
      "indent code-block": null,
      "outdent code-block": null,
      "remove tab": null,
    },
  },
}

type Active = Record<string, unknown>

interface Tool {
  key: string
  label: string
  Icon: LucideIcon
  format?: string
  value?: string | boolean
}

const TOOLS: Tool[] = [
  { key: "bold", label: "Negrita", Icon: Bold, format: "bold", value: true },
  { key: "italic", label: "Cursiva", Icon: Italic, format: "italic", value: true },
  { key: "underline", label: "Subrayado", Icon: Underline, format: "underline", value: true },
  { key: "bullet", label: "Lista con viñetas", Icon: List, format: "list", value: "bullet" },
  { key: "ordered", label: "Lista numerada", Icon: ListOrdered, format: "list", value: "ordered" },
  { key: "clean", label: "Quitar formato", Icon: Eraser },
]

const toolButton =
  "size-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 aria-pressed:bg-[#087F72] aria-pressed:text-white"

export default function RichTextEditorImpl({
  value,
  onChange,
  placeholder,
  maxLength,
  label,
  minHeight = 112,
}: RichTextEditorProps) {
  const [raw, setRaw] = useState(value)
  const [synced, setSynced] = useState(value)
  const [length, setLength] = useState(() => toPlainText(value).length)
  const [active, setActive] = useState<Active>({})
  const quillRef = useRef<ReactQuill>(null)

  if (value !== synced) {
    setSynced(value)
    if (value !== normalizeHtml(raw)) {
      setRaw(value)
      setLength(toPlainText(value).length)
    }
  }

  useEffect(() => {
    const root = quillRef.current?.getEditor().root
    if (!root) return
    root.setAttribute("role", "textbox")
    root.setAttribute("aria-multiline", "true")
    root.setAttribute("aria-label", label)
  }, [label])

  const syncActive = () => {
    const quill = quillRef.current?.getEditor()
    setActive(quill && quill.hasFocus() ? quill.getFormat() : {})
  }

  const apply = (tool: Tool) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    quill.focus()
    const range = quill.getSelection()
    if (!tool.format) {
      if (range && range.length > 0) quill.removeFormat(range.index, range.length, "user")
      else {
        INLINE.forEach(name => quill.format(name, false, "user"))
        quill.format("list", false, "user")
      }
    } else {
      const current = quill.getFormat()[tool.format]
      quill.format(tool.format, current === tool.value ? false : tool.value, "user")
    }
    syncActive()
  }

  const modules = useMemo(() => MODULES, [])

  const handleChange = (html: string, _delta: unknown, source: string, editor: ReactQuill.UnprivilegedEditor) => {
    const quill = quillRef.current?.getEditor()
    const size = Math.max(0, editor.getLength() - 1)
    if (maxLength && quill && size > maxLength && source === "user") {
      quill.deleteText(maxLength, size - maxLength)
      return
    }
    setRaw(html)
    setLength(size)
    onChange(normalizeHtml(html))
  }

  return (
    <div className="ayni-editor rounded-2xl bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-[#087F72]/30 overflow-hidden">
      <div role="toolbar" aria-label="Formato del texto" className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        {TOOLS.map(({ key, label: toolLabel, Icon, format, value: toolValue }, index) => (
          <React.Fragment key={key}>
            {index === 3 && <span className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />}
            <button
              type="button"
              className={toolButton}
              aria-label={toolLabel}
              title={toolLabel}
              aria-pressed={format ? active[format] === toolValue : undefined}
              onMouseDown={e => e.preventDefault()}
              onClick={() => apply({ key, label: toolLabel, Icon, format, value: toolValue })}
            >
              <Icon className="size-4" />
            </button>
          </React.Fragment>
        ))}
      </div>
      <ReactQuill
        ref={quillRef}
        theme=""
        value={raw}
        onChange={handleChange}
        onChangeSelection={syncActive}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
        style={{ ["--editor-min-height" as string]: `${minHeight}px` }}
      />
      {maxLength && (
        <p className={`px-3 pb-1.5 text-right text-[11px] ${length >= maxLength ? "font-bold text-rose-600" : "text-gray-400"}`} aria-live="polite">
          {length}/{maxLength}
        </p>
      )}
    </div>
  )
}
