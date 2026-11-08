import { LegalPage } from "@/components/legal/LegalPage"

export const metadata = {
  title: "Reglas de la comunidad · Ayni",
  description: "Cómo nos cuidamos entre vecinos en Ayni.",
}

export default function ReglasPage() {
  return (
    <LegalPage
      title="Reglas de la comunidad"
      intro="Ayni funciona porque los vecinos confiamos unos en otros. Estas reglas ayudan a que siga siendo así."
      sections={[
        {
          title: "Trata a todos con respeto",
          items: [
            "Escribe como le hablarías a un vecino en la puerta de tu casa.",
            "No se permiten insultos, discriminación ni amenazas.",
          ],
        },
        {
          title: "El muro solidario es sin dinero",
          items: [
            "En «Necesito» y «Ofrezco» se presta, se regala o se ayuda sin cobrar.",
            "Si quieres ofrecer un servicio pagado, recomiéndalo como negocio en el directorio.",
          ],
        },
        {
          title: "Recomienda solo lo que conoces",
          items: [
            "Recomienda negocios y servicios que hayas usado tú o alguien de confianza.",
            "No recomiendes tu propio negocio haciéndote pasar por cliente.",
          ],
        },
        {
          title: "Las emergencias son serias",
          items: [
            "Usa el botón de emergencia solo cuando alguien necesita ayuda de verdad.",
            "Si es urgente, llama también al 105, 116 o 106: Ayni no reemplaza a los servicios de emergencia.",
            "Cuando la ayuda llegue, marca el reporte como atendido para que otros sepan que ya no hace falta.",
          ],
        },
        {
          title: "La junta vecinal modera",
          items: [
            "Una revisión automática lee cada publicación y recomendación antes de que aparezca. Lo que está claro se publica en segundos; lo dudoso o sospechoso pasa a los moderadores.",
            "Los moderadores de la junta vecinal tienen la última palabra: revisan lo que la revisión automática les pasa y lo que reportan los vecinos.",
            "Pueden rechazar contenido que no cumpla estas reglas y desactivar cuentas que las incumplan varias veces.",
          ],
        },
      ]}
    />
  )
}
