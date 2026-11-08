"use client"

import * as React from "react"
import { useState } from "react"
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

const DEMO_ACCOUNTS = {
  vecino: { phone: "900000002", password: "Vecino1234" },
  moderador: { phone: "900000001", password: "Moderador123" },
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.friendlyMessage : fallback
}

export function AuthCard() {
  const [loginPhone, setLoginPhone] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const [showDemoPanel, setShowDemoPanel] = useState(false)

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
      window.location.href = "/"
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? "El número o la contraseña no coinciden. Revísalos e intenta otra vez."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez.")
      )
      setLoginLoading(false)
    }
  }

  const handleDemoAccess = async (demoRole: keyof typeof DEMO_ACCOUNTS) => {
    setLoginError("")
    setLoginLoading(true)
    try {
      await authService.login(DEMO_ACCOUNTS[demoRole])
      window.location.href = "/"
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? "Las cuentas de demostración no están activas en este servidor."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez.")
      )
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

        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
          <span className="py-2 text-xs sm:text-sm font-bold rounded-lg bg-background text-foreground shadow-sm">
            Iniciar Sesión
          </span>
          <Link
            href="/registro"
            className="py-2 text-xs sm:text-sm font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            Crear Cuenta Vecinal
          </Link>
        </div>
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
              <span className="text-[11px] text-[#087F72] hover:underline cursor-pointer">
                ¿Olvidaste tu clave?
              </span>
            </div>
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
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoAccess("vecino")}
                  className="h-8 text-xs font-semibold rounded-lg justify-start"
                >
                  <UserIcon className="size-3.5" />
                  Vecino General
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoAccess("moderador")}
                  className="h-8 text-xs font-semibold rounded-lg justify-start border-rose-500/30 text-rose-600 dark:text-rose-400"
                >
                  <Siren className="size-3.5" />
                  Moderador (Junta SOS)
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
