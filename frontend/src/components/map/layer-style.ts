export interface LayerStyle {
  color: string
  pin: string
  soft: string
  chip: string
}

const STYLES: Record<string, LayerStyle> = {
  businesses: { color: "#087F72", pin: "bg-[#087F72]", soft: "bg-[#EAF5F1] text-[#087F72]", chip: "bg-[#087F72] text-white" },
  wall: { color: "#B45309", pin: "bg-[#B45309]", soft: "bg-amber-100 text-[#8A5800]", chip: "bg-[#B45309] text-white" },
  emergencies: { color: "#BA1A1A", pin: "bg-[#BA1A1A]", soft: "bg-rose-100 text-[#BA1A1A]", chip: "bg-[#BA1A1A] text-white" },
  supportPoints: { color: "#2563EB", pin: "bg-[#2563EB]", soft: "bg-blue-100 text-blue-700", chip: "bg-[#2563EB] text-white" },
}

const FALLBACK: LayerStyle = { color: "#57534E", pin: "bg-[#57534E]", soft: "bg-gray-100 text-gray-700", chip: "bg-[#57534E] text-white" }

export function layerStyle(layer: string): LayerStyle {
  return STYLES[layer] ?? FALLBACK
}
