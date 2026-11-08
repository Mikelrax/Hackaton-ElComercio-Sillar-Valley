import { LegalPage } from "@/components/legal/LegalPage"

export const metadata = {
  title: "Política de privacidad · Ayni",
  description: "Qué datos guarda Ayni y quién puede verlos.",
}

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Te contamos qué datos guardamos, para qué los usamos y quién puede verlos."
      sections={[
        {
          title: "Qué datos guardamos",
          items: [
            "Tu nombre, tu número de celular y tu contraseña. La contraseña se guarda cifrada: nadie puede leerla.",
            "Las direcciones que registras, para mostrarte lo que hay cerca.",
            "Lo que publicas: favores, recomendaciones, respuestas y reportes de emergencia.",
          ],
        },
        {
          title: "Qué ven tus vecinos",
          items: [
            "Tu nombre y tu barrio, nunca la dirección exacta de tu casa.",
            "En el mapa, tus favores y reportes aparecen en una ubicación aproximada, a unos 150 metros del lugar real.",
            "Tu celular solo se comparte cuando aceptas la ayuda de un vecino, o cuando él acepta la tuya, para coordinar por WhatsApp.",
            "Si reportas una emergencia, quien va en camino a ayudarte ve tu celular y la ubicación exacta para poder llegar.",
          ],
        },
        {
          title: "Qué ve la junta vecinal",
          items: [
            "Los moderadores ven tu nombre, tu celular y tu barrio para moderar y coordinar emergencias.",
            "Pueden desactivar una cuenta o darte una clave temporal si olvidaste la tuya.",
          ],
        },
        {
          title: "En tu teléfono",
          items: [
            "Guardamos tu sesión y lo que publicas sin señal hasta que se pueda enviar.",
            "Al cerrar sesión borramos la sesión, lo pendiente de enviar y los datos guardados para usar la app sin conexión.",
          ],
        },
        {
          title: "Lo que no hacemos",
          items: [
            "No vendemos ni compartimos tus datos con empresas.",
            "No usamos tus datos para publicidad.",
            "El mapa se carga desde OpenFreeMap, que recibe la zona del mapa que estás viendo, no tus datos personales.",
          ],
        },
        {
          title: "Si quieres dejar Ayni",
          items: ["Pide a un moderador de tu junta vecinal que desactive tu cuenta. Así nadie podrá volver a entrar con ella."],
        },
      ]}
    />
  )
}
