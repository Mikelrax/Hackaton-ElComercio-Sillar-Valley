import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthCard } from "@/components/auth/AuthCard"
import { SoftBackdrop } from "@/components/layout/SoftBackdrop"

export const metadata = {
  title: "Ingresar · Ayni",
  description: "Ingresa a Ayni con tu celular y tu contraseña.",
}

export default function LoginPage() {
  return (
    <SoftBackdrop className="flex flex-col items-center justify-center px-4 py-6 sm:p-6">
      <div className="w-full max-w-[440px] mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 pr-3 text-[15px] font-semibold text-[#57534E] hover:text-[#1C1917] transition-colors"
        >
          <span className="size-11 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center">
            <ArrowLeft className="size-5" />
          </span>
          Volver al inicio
        </Link>
      </div>

      <AuthCard />

      <footer className="mt-6 text-center text-sm text-[#57534E] space-x-3">
        <span>© 2026 Ayni · Arequipa</span>
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        <Link href="/reglas" className="hover:underline">Reglas</Link>
      </footer>
    </SoftBackdrop>
  )
}
