import { RegisterFlow } from "@/components/auth/RegisterFlow"

export const metadata = {
  title: "Crea tu cuenta · AYNI",
  description: "Regístrate en AYNI en 3 pasos: tus datos, tu contraseña y tu barrio.",
}

export default function RegistroPage() {
  return <RegisterFlow />
}
