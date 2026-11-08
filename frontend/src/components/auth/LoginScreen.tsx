import Link from "next/link"
import { AuthCard } from "@/components/auth/AuthCard"
import { SoftBackdrop } from "@/components/layout/SoftBackdrop"
import { LANDING_URL } from "@/lib/hosts"

export function LoginScreen() {
  return (
    <SoftBackdrop className="flex flex-col items-center justify-center px-4 py-6 sm:p-6">
      <AuthCard />

      <footer className="mt-6 text-center text-sm text-[#57534E] space-x-3">
        <span>© 2026 Ayni · Arequipa</span>
        <a href={`${LANDING_URL}/`} className="hover:underline">Conoce Ayni</a>
        <Link href="/privacidad" className="hover:underline">Privacidad</Link>
        <Link href="/reglas" className="hover:underline">Reglas</Link>
      </footer>
    </SoftBackdrop>
  )
}
