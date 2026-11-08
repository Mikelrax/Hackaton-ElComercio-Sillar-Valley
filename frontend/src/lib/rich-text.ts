export type RichTag = "p" | "br" | "strong" | "em" | "u" | "s" | "ul" | "ol" | "li"
export type RichNode = string | { tag: RichTag; children: RichNode[] }

const ALLOWED = new Set<string>(["p", "br", "strong", "em", "u", "s", "ul", "ol", "li"])
const ALIASES: Record<string, RichTag> = { b: "strong", i: "em", strike: "s", del: "s" }
const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }
const TOKEN = /<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>|([^<]+)|</gi
const RICH = /^\s*<(p|ul|ol)[\s>]/i

export function isRichText(value: string | null | undefined): boolean {
  return !!value && RICH.test(value)
}

function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : match
    }
    return NAMED[entity.toLowerCase()] ?? match
  })
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function parseRich(html: string): RichNode[] {
  const root: RichNode[] = []
  const stack: { tag: RichTag; children: RichNode[] }[] = []
  const current = () => (stack.length ? stack[stack.length - 1].children : root)
  TOKEN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TOKEN.exec(html)) !== null) {
    if (match[4] !== undefined) {
      current().push(decode(match[4]))
      continue
    }
    if (match[2] === undefined) {
      current().push("<")
      continue
    }
    const raw = match[2].toLowerCase()
    const name = ALIASES[raw] ?? raw
    if (!ALLOWED.has(name)) continue
    const tag = name as RichTag
    if (match[1]) {
      const at = stack.map(node => node.tag).lastIndexOf(tag)
      if (at >= 0) stack.length = at
      continue
    }
    const node = { tag, children: [] as RichNode[] }
    current().push(node)
    if (tag !== "br" && !match[3]) stack.push(node)
  }
  return root
}

export function serialize(nodes: RichNode[]): string {
  return nodes
    .map(node => {
      if (typeof node === "string") return escapeHtml(node)
      if (node.tag === "br") return "<br>"
      return `<${node.tag}>${serialize(node.children)}</${node.tag}>`
    })
    .join("")
}

function hasText(nodes: RichNode[]): boolean {
  return nodes.some(node => (typeof node === "string" ? node.trim() !== "" : hasText(node.children)))
}

export function normalizeHtml(raw: string): string {
  const nodes = parseRich(raw)
  return hasText(nodes) ? serialize(nodes) : ""
}

function inline(nodes: RichNode[]): string {
  return nodes
    .map(node => {
      if (typeof node === "string") return node
      if (node.tag === "br") return "\n"
      return inline(node.children)
    })
    .join("")
}

export function toPlainText(value: string | null | undefined): string {
  if (!value) return ""
  if (!isRichText(value)) return value.trim()
  const lines: string[] = []
  for (const node of parseRich(value)) {
    if (typeof node === "string") {
      lines.push(node)
    } else if (node.tag === "ul" || node.tag === "ol") {
      node.children.forEach((item, index) => {
        if (typeof item === "string") return
        lines.push(`${node.tag === "ol" ? `${index + 1}.` : "•"} ${inline(item.children).trim()}`)
      })
    } else {
      lines.push(inline(node.children).replace(/^\n+$/, ""))
    }
  }
  return lines
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function plainToHtml(text: string): string {
  const lines = text.trim().split(/\r?\n/)
  if (lines.join("").trim() === "") return ""
  return lines.map(line => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>")).join("")
}

export function toHtml(value: string | null | undefined): string {
  if (!value) return ""
  return isRichText(value) ? normalizeHtml(value) : plainToHtml(value)
}

export function dropLeadingTitle(html: string, title: string): string | undefined {
  const [first, ...rest] = parseRich(html)
  if (first && typeof first !== "string" && first.tag === "p" && toPlainText(serialize([first])) === title) {
    return hasText(rest) ? serialize(rest) : undefined
  }
  return html
}
