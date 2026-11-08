"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User as UserIcon, Eye, EyeOff, ChevronDown, ChevronUp, Siren } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { FormError } from "@/components/ui/form-error"
import { authService } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { DemoAccount } from "@/lib/types"
import { formatPhone, phoneDigits } from "@/lib/phone"
import { inputClass, labelClass, primaryButton } from "@/lib/form-styles"

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.friendlyMessage : fallback
}

export function AuthCard() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])

  useEffect(() => {
    if (authService.getCurrentUser()) {
      router.replace("/")
      return
    }
    let cancelled = false
    authService
      .demoAccounts()
      .then(list => {
        if (!cancelled) setDemoAccounts(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (phone.length !== 9 || !password) {
      setError("Escribe tus 9 dígitos de celular y tu contraseña.")
      return
    }

    setLoading(true)
    try {
      await authService.login({ phone, password })
      router.push("/")
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "El número o la contraseña no coinciden. Revísalos e intenta otra vez."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez.")
      )
      setLoading(false)
    }
  }

  const handleDemoAccess = async (key: string) => {
    setError("")
    setLoading(true)
    try {
      await authService.demoLogin(key)
      router.push("/")
    } catch (err) {
      setError(errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez."))
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] bg-white rounded-2xl border border-border/80 shadow-xl px-5 py-6 sm:px-7 sm:py-7 space-y-6 text-[#1C1917]">
      <div className="text-center space-y-3">
        <Link href="/" className="inline-flex hover:opacity-90 transition-opacity">
          <Logo size="lg" />
        </Link>
        <h1 className="text-[26px] font-bold tracking-tight leading-tight">Ingresa a tu barrio</h1>
        <p className="text-[16px] text-[#57534E]">Con el celular y la contraseña que usaste al registrarte.</p>
      </div>

      <form onSubmit={handleLogin} noValidate className="space-y-5">
        <div>
          <label htmlFor="login-phone" className={labelClass}>Tu celular</label>
          <div className="flex gap-2">
            <span className="h-14 px-4 rounded-2xl border-2 border-[#E7E5E4] bg-white flex items-center text-[17px] font-semibold text-[#57534E]">
              +51
            </span>
            <input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={formatPhone(phone)}
              onChange={e => setPhone(phoneDigits(e.target.value))}
              placeholder="987 654 321"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="block text-[15px] font-semibold text-[#1C1917]">Tu contraseña</label>
            <button
              type="button"
              onClick={() => setShowForgot(!showForgot)}
              aria-expanded={showForgot}
              className="text-[14px] font-semibold text-[#087F72] hover:underline"
            >
              ¿Olvidaste tu clave?
            </button>
          </div>
          {showForgot && (
            <p className="mb-2 rounded-2xl bg-[#EAF5F1] border border-[#087F72]/20 p-3.5 text-[15px] leading-snug text-[#115E59]" role="status">
              Pide ayuda a un moderador de tu junta vecinal: desde su panel puede darte una clave temporal para que
              vuelvas a entrar con tu mismo número.
            </p>
          )}
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`${inputClass} pr-28`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 rounded-xl flex items-center gap-1.5 text-[15px] font-bold text-[#087F72] hover:bg-[#EAF5F1]"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        {error && <FormError>{error}</FormError>}

        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>

        <p className="text-center text-[15px] text-[#57534E]">
          ¿Primera vez en Ayni?{" "}
          <Link href="/registro" className="font-bold text-[#087F72] hover:underline">
            Crea tu cuenta gratis
          </Link>
        </p>
      </form>

      {demoAccounts.length > 0 && (
        <div className="pt-4 border-t border-[#E7E5E4]">
          <button
            type="button"
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            aria-expanded={showDemoPanel}
            className="w-full flex items-center justify-between py-2 text-[15px] font-semibold text-[#57534E] hover:text-[#1C1917]"
          >
            Acceso rápido para evaluadores
            {showDemoPanel ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showDemoPanel && (
            <div className="mt-2 space-y-2">
              <p className="text-[14px] text-[#57534E]">Elige una cuenta de prueba para entrar con un toque:</p>
              {demoAccounts.map(account => {
                const isModerator = account.role === "MODERATOR"
                const Icon = isModerator ? Siren : UserIcon
                return (
                  <button
                    key={account.key}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoAccess(account.key)}
                    className={`w-full flex items-start gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition-colors hover:bg-[#F5F5F4] disabled:opacity-60 ${
                      isModerator ? "border-[#BA1A1A]/30" : "border-[#E7E5E4]"
                    }`}
                  >
                    <Icon className={`size-5 mt-0.5 shrink-0 ${isModerator ? "text-[#BA1A1A]" : "text-[#087F72]"}`} />
                    <span className="min-w-0">
                      <span className={`block text-[15px] font-bold ${isModerator ? "text-[#BA1A1A]" : "text-[#1C1917]"}`}>
                        {account.title}
                      </span>
                      <span className="block text-[14px] text-[#57534E]">
                        {account.fullName}
                        {account.neighborhood ? ` · ${account.neighborhood}` : ""}
                      </span>
                      <span className="block text-[14px] text-[#78716C]">{account.summary}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
