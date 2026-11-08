import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthCard } from "@/components/auth/AuthCard"

export const metadata = {
  title: "Acceso a AYNI · Arequipa",
  description: "Registro e inicio de sesión para vecinos del barrio",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background">
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-lg mb-4 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al inicio</span>
        </Link>
        <span className="text-[11px] text-muted-foreground font-medium">Arequipa, Perú</span>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <AuthCard />

        <footer className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>© 2026 AYNI · Plataforma Cívica Barrial</p>
          <p className="text-[11px] text-muted-foreground/80">
            Conectando a vecinos para resolver necesidades y cuidarnos en emergencias
          </p>
        </footer>
      </div>
    </div>
  )
}
