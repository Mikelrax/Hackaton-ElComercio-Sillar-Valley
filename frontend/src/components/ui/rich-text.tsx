import React from "react"
import { isRichText, parseRich, type RichNode } from "@/lib/rich-text"

function renderNodes(nodes: RichNode[], prefix: string): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${prefix}${index}`
    if (typeof node === "string") return node
    const children = renderNodes(node.children, `${key}-`)
    switch (node.tag) {
      case "br":
        return <br key={key} />
      case "strong":
        return <strong key={key}>{children}</strong>
      case "em":
        return <em key={key}>{children}</em>
      case "u":
        return <u key={key}>{children}</u>
      case "s":
        return <s key={key}>{children}</s>
      case "ul":
        return (
          <ul key={key} className="list-disc pl-5 space-y-0.5">
            {children}
          </ul>
        )
      case "ol":
        return (
          <ol key={key} className="list-decimal pl-5 space-y-0.5">
            {children}
          </ol>
        )
      case "li":
        return <li key={key}>{children}</li>
      default:
        return (
          <p key={key} className="[&:not(:last-child)]:mb-2 min-h-[1lh]">
            {children}
          </p>
        )
    }
  })
}

interface RichTextProps {
  value: string
  className?: string
}

export const RichText: React.FC<RichTextProps> = ({ value, className = "" }) => {
  if (!isRichText(value)) {
    return <div className={`whitespace-pre-line wrap-break-word ${className}`}>{value}</div>
  }
  return <div className={`whitespace-pre-wrap wrap-break-word ${className}`}>{renderNodes(parseRich(value), "n")}</div>
}
