"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  User as UserIcon,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Siren,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Logo } from "@/components/brand/Logo"
import { authService } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { DemoAccount } from "@/lib/types"

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.friendlyMessage : fallback
}

export function AuthCard() {
  const [loginPhone, setLoginPhone] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const [showDemoPanel, setShowDemoPanel] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])

  useEffect(() => {
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
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    if (!loginPhone || !loginPassword) {
      setLoginError("Por favor ingresa tu número de celular y contraseña.")
      return
    }

    setLoginLoading(true)
    try {
      await authService.login({ phone: loginPhone, password: loginPassword })
      window.location.assign("/")
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? "El número o la contraseña no coinciden. Revísalos e intenta otra vez."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez.")
      )
      setLoginLoading(false)
    }
  }

  const handleDemoAccess = async (key: string) => {
    setLoginError("")
    setLoginLoading(true)
    try {
      await authService.demoLogin(key)
      window.location.assign("/")
    } catch (err) {
      setLoginError(errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez."))
      setLoginLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/80 bg-card/95 backdrop-blur-md shadow-xl transition-all">
      <CardHeader className="text-center pb-4 space-y-3">
        <div className="flex justify-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="lg" />
          </Link>
        </div>

        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Ingresa para conectarte con los servicios y la red de apoyo de tu barrio
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm text-destructive border border-destructive/20">
              <AlertCircle className="size-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="login-phone" className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="size-3.5 text-[#087F72]" />
              Número de Celular
            </Label>
            <Input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              placeholder="Ej. 987 654 321"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              autoComplete="tel-national"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold flex items-center gap-1.5">
                <Lock className="size-3.5 text-[#087F72]" />
                Contraseña
              </Label>
              <button
                type="button"
                onClick={() => setShowForgot(!showForgot)}
                aria-expanded={showForgot}
                className="text-[11px] font-semibold text-[#087F72] hover:underline"
              >
                ¿Olvidaste tu clave?
              </button>
            </div>
            {showForgot && (
              <p className="rounded-xl bg-[#EAF5F1] border border-[#087F72]/20 p-3 text-xs leading-relaxed text-[#115E59]" role="status">
                Pide ayuda a un moderador de tu junta vecinal: desde su panel puede darte una clave temporal para que
                vuelvas a entrar con tu mismo número.
              </p>
            )}
            <div className="relative">
              <Input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginLoading}
            className="w-full h-11 text-sm font-bold bg-[#087F72] hover:bg-[#075E54] text-white rounded-xl shadow-md transition-all active:scale-98"
          >
            {loginLoading ? "Ingresando al barrio..." : "Ingresar a AYNI"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ¿Primera vez en AYNI?{" "}
            <Link href="/registro" className="font-bold text-[#087F72] hover:underline">
              Crea tu cuenta gratis
            </Link>
          </p>
        </form>

        {demoAccounts.length > 0 && (
        <div className="pt-3 border-t border-border/70">
          <button
            type="button"
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              Panel de Evaluación Rápida (Para Evaluadores)
            </span>
            {showDemoPanel ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {showDemoPanel && (
            <div className="mt-2.5 p-3 rounded-xl bg-muted/60 border border-border/70 space-y-2 text-xs">
              <p className="text-[11px] text-muted-foreground">
                Selecciona un perfil demostrativo precargado para ingresar en 1 clic:
              </p>
              <div className="space-y-2">
                {demoAccounts.map(account => {
                  const isModerator = account.role === "MODERATOR"
                  const Icon = isModerator ? Siren : UserIcon
                  return (
                    <button
                      key={account.key}
                      type="button"
                      disabled={loginLoading}
                      onClick={() => handleDemoAccess(account.key)}
                      className={`w-full flex items-start gap-2.5 rounded-lg border bg-background p-2.5 text-left transition-colors hover:bg-muted disabled:opacity-60 ${
                        isModerator ? "border-rose-500/30" : "border-border"
                      }`}
                    >
                      <Icon className={`size-4 mt-0.5 shrink-0 ${isModerator ? "text-rose-600" : "text-[#087F72]"}`} />
                      <span className="min-w-0">
                        <span className={`block text-xs font-bold ${isModerator ? "text-rose-600" : "text-foreground"}`}>
                          {account.title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {account.fullName}
                          {account.neighborhood ? ` · ${account.neighborhood}` : ""}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{account.summary}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
