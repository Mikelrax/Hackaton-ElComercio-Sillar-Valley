import { HandHelping, Map as MapIcon, ShieldAlert, Sparkles, Store, WifiOff, type LucideIcon } from "lucide-react"

export type DemoId = "directorio" | "kusi" | "muro" | "mapa" | "emergencia" | "offline"

export interface Demo {
  id: DemoId
  label: string
  title: string
  description: string
  steps: string[]
  icon: LucideIcon
  accent: string
  soft: string
  offline?: boolean
}

export const DEMOS: Demo[] = [
  {
    id: "directorio",
    label: "Directorio",
    title: "Encuentra quién te ayuda cerca de casa",
    description:
      "Busca o filtra por categoría: cada negocio muestra cuántos vecinos lo recomiendan, a qué distancia está y si está abierto ahora.",
    steps: ["Busca «menú», «gasfitero» o «costura»", "Mira quién lo recomienda y qué opinan", "Escribe por WhatsApp o llama con un toque"],
    icon: Store,
    accent: "#087F72",
    soft: "#EAF5F1",
  },
  {
    id: "kusi",
    label: "Kusi",
    title: "Pregúntale a Kusi con tus palabras",
    description:
      "Kusi es el asistente de Ayni: le cuentas tu problema y te sugiere negocios, favores o puntos de apoyo reales de tu barrio.",
    steps: ["Escribe o dicta tu pregunta", "Kusi busca entre lo que recomiendan tus vecinos", "Toca la tarjeta para ver el contacto"],
    icon: Sparkles,
    accent: "#B45309",
    soft: "#FEF3C7",
  },
  {
    id: "muro",
    label: "Muro solidario",
    title: "Pide u ofrece un favor sin dinero",
    description:
      "Préstamo de herramientas, donaciones, cuidado de adultos mayores y trueque de habilidades entre vecinos de confianza.",
    steps: ["Filtra entre «Necesito» y «Ofrezco»", "Elige el tipo y la categoría", "Cuéntalo en pocas palabras y publica"],
    icon: HandHelping,
    accent: "#0F766E",
    soft: "#E6F4F1",
  },
  {
    id: "mapa",
    label: "Mapa",
    title: "Todo tu barrio en un solo mapa",
    description:
      "Negocios, favores, emergencias y puntos de apoyo a 500 m, 1, 2 o 5 km de tu casa o de donde estés ahora.",
    steps: ["Elige qué tan lejos buscar", "Toca un grupo para acercarte", "Abre la ficha o pide cómo llegar"],
    icon: MapIcon,
    accent: "#0369A1",
    soft: "#E0F2FE",
  },
  {
    id: "emergencia",
    label: "Emergencia",
    title: "Ayuda inmediata cuando más se necesita",
    description:
      "Números de emergencia a un toque, reportes cercanos con prioridad y puntos de apoyo abiertos para coordinar entre vecinos.",
    steps: ["Llama al 105, 116, 106 o 115 con un toque", "Cuenta qué pasa y quién es más vulnerable", "Tus vecinos ven el aviso y van en camino"],
    icon: ShieldAlert,
    accent: "#BA1A1A",
    soft: "#FFE4E6",
  },
  {
    id: "offline",
    label: "Sin señal",
    title: "Funciona aunque se caiga la señal",
    description:
      "Si no hay internet, Ayni guarda tu publicación o tu alerta en el celular y la envía sola apenas vuelve la conexión.",
    steps: ["Publica como siempre, aun en modo avión", "Ayni guarda el aviso en tu celular", "Se envía solo cuando vuelve la señal"],
    icon: WifiOff,
    accent: "#334155",
    soft: "#F1F5F9",
    offline: true,
  },
]

export function demoVideo(id: DemoId | "tour") {
  return { src: `/demo/${id}.mp4`, poster: `/demo/${id}.jpg` }
}
