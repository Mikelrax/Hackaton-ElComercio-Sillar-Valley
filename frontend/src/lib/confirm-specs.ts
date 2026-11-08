import type { ConfirmSpec } from "@/components/ui/confirm-dialog"

export const SAFETY_WARNING =
  "No te pongas en riesgo. Si hay fuego, derrumbe, cables caídos o mucha agua, no entres: llama a los números de emergencia y espera ayuda."

export const DEFAULT_RESPONSE = {
  REQUEST: "¡Hola! Yo te puedo ayudar con esto.",
  OFFER: "¡Hola! Me interesa lo que ofreces.",
}

export function respondSpec(type: "REQUEST" | "OFFER", author: string | null, title: string): ConfirmSpec {
  const who = author ?? "tu vecino"
  return type === "REQUEST"
    ? {
        title: `¿Le ayudas a ${who}?`,
        body: `Le enviaremos tu mensaje sobre «${title}». Cuando lo acepte, verás su número en «Mi actividad» del muro.`,
        confirmLabel: "Enviar",
        message: { label: "Tu mensaje", initial: DEFAULT_RESPONSE.REQUEST, maxLength: 1000 },
      }
    : {
        title: `¿Te interesa lo que ofrece ${who}?`,
        body: `Le enviaremos tu mensaje sobre «${title}». Cuando lo acepte, verás su número en «Mi actividad» del muro.`,
        confirmLabel: "Enviar",
        message: { label: "Tu mensaje", initial: DEFAULT_RESPONSE.OFFER, maxLength: 1000 },
      }
}

export function onTheWaySpec(title: string, reporter: string | null): ConfirmSpec {
  return {
    title: "¿Vas en camino?",
    body: `${reporter ?? "Quien reportó"} verá que vas a ayudar con «${title}». Recibirás su teléfono y la ubicación exacta.`,
    warning: SAFETY_WARNING,
    tone: "red",
    confirmLabel: "Sí, voy",
    message: { label: "Mensaje para avisar (opcional)", placeholder: "Ej.: Llego en 10 minutos con agua" },
  }
}

export function claimSpec(title: string, reporter: string): ConfirmSpec {
  return {
    title: "¿Necesitas este recurso?",
    body: `${reporter} sabrá que necesitas «${title}» y verás su teléfono para coordinar.`,
    confirmLabel: "Sí, lo necesito",
    message: { label: `Mensaje para ${reporter} (opcional)`, placeholder: "Ej.: Somos 4 en casa, nos ayudarían 2 bidones" },
  }
}

export const RELEASE_SPEC: ConfirmSpec = {
  title: "¿Ya no puedes ir?",
  body: "El reporte volverá a «Sin atender» para que otro vecino pueda ayudar.",
  confirmLabel: "Sí, ya no puedo",
}

export function attendedSpec(offer: boolean): ConfirmSpec {
  return offer
    ? { title: "¿Ya no tienes este recurso?", body: "Dejará de aparecer como disponible para tus vecinos.", confirmLabel: "Sí, ya no hay" }
    : { title: "¿Ya está atendido?", body: "El reporte se cerrará y dejará de aparecer como pendiente.", confirmLabel: "Sí, está atendido" }
}
