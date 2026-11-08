"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Navigation,
  ShieldCheck,
  User as UserIcon,
  Phone,
  Lock,
  Eye,
  EyeOff,
  HeartHandshake,
  Users,
  Store,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Accessibility,
  Backpack,
  Wrench,
  Siren,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/brand/Logo"
import { authService, UserProfile, UserRole } from "@/lib/auth"
import { ApiError } from "@/lib/api"

// Cuentas de ejemplo que crea el backend cuando APP_SEED=true (ver README).
const DEMO_ACCOUNTS = {
  vecino: { phone: "900000002", password: "Vecino1234" },
  moderador: { phone: "900000001", password: "Moderador123" },
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.friendlyMessage : fallback
}

const NEIGHBORHOODS = [
  "Yanahuara",
  "Cayma",
  "Cerro Colorado",
  "Cercado - Arequipa",
  "Paucarpata",
  "José Luis Bustamante y Rivero",
  "Alto Selva Alegre",
  "Miraflores",
  "Sachaca",
]

const PROFILES: { id: UserProfile; title: string; subtitle: string; icon: LucideIcon }[] = [
  {
    id: "mayor",
    title: "Adulto Mayor",
    subtitle: "Modo accesible con letras grandes y apoyo prioritario",
    icon: Accessibility,
  },
  {
    id: "familia",
    title: "Familia / Padres",
    subtitle: "Apoyo escolar, trueque de ropa y actividades familiares",
    icon: Users,
  },
  {
    id: "joven",
    title: "Joven / Estudiante",
    subtitle: "Oportunidades locales, mandados y voluntariado",
    icon: Backpack,
  },
  {
    id: "adulto",
    title: "Vecino / Oficios",
    subtitle: "Servicios del hogar, herramientas y directorio del barrio",
    icon: Wrench,
  },
]

export function AuthCard() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")

  // Estado del Login
  const [loginPhone, setLoginPhone] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Estado del Registro
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [role, setRole] = useState<UserRole>("vecino")
  const [profile, setProfile] = useState<UserProfile>("adulto")
  const [neighborhood, setNeighborhood] = useState("Yanahuara")
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsMessage, setGpsMessage] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [showInvite, setShowInvite] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState("")

  // Panel colapsable de demostración para el jurado
  const [showDemoPanel, setShowDemoPanel] = useState(false)

  // Captura inteligente de GPS nativo
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage("Tu navegador no soporta geolocalización.")
      return
    }

    setGpsLoading(true)
    setGpsMessage("")

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setGpsLoading(false)
        setGpsMessage(
          `GPS Fijado: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        )
      },
      (err) => {
        console.warn("GPS local fallback:", err)
        setGpsCoords({ lat: -16.3988, lng: -71.535 })
        setGpsLoading(false)
        setGpsMessage("Ubicación aproximada del barrio asignada (-16.3988, -71.535)")
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Envío de Inicio de Sesión
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
      // Forzar redirección limpia a la raíz
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

  // Acceso de Demostración para evaluación (cuentas de ejemplo del backend)
  const handleDemoAccess = async (demoRole: keyof typeof DEMO_ACCOUNTS) => {
    setLoginError("")
    setLoginLoading(true)
    try {
      await authService.login(DEMO_ACCOUNTS[demoRole])
      window.location.href = "/"
    } catch (err) {
      setMode("login")
      setLoginError(
        err instanceof ApiError && err.status === 401
          ? "Las cuentas de demostración no están activas en este servidor."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta otra vez.")
      )
      setLoginLoading(false)
    }
  }

  // Envío de Registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")

    if (!name.trim()) {
      setRegisterError("Ingresa tu nombre completo.")
      return
    }
    if (!phone.trim() || phone.length < 8) {
      setRegisterError("Ingresa un número de celular válido de 9 dígitos.")
      return
    }
    if (!password || password.length < 8) {
      setRegisterError("La contraseña debe tener al menos 8 letras o números.")
      return
    }

    setRegisterLoading(true)
    try {
      const location = {
        lat: gpsCoords?.lat ?? -16.3988,
        lng: gpsCoords?.lng ?? -71.535,
        neighborhood,
      }

      await authService.register({
        name,
        phone,
        password,
        role,
        profile,
        location,
        inviteCode: showInvite ? inviteCode : undefined,
      })

      window.location.href = "/"
    } catch (err) {
      setRegisterError(errorMessage(err, "No pudimos crear tu cuenta. Intenta otra vez."))
      setRegisterLoading(false)
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

        {/* Selector de Pestaña: Iniciar Sesión / Crear Cuenta */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Crear Cuenta Vecinal
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {mode === "login" ? (
          /* ================= FORMULARIO LOGIN ================= */
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
                placeholder="Ej. 987 654 321"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                autoComplete="tel"
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
          </form>
        ) : (
          /* ================= FORMULARIO REGISTRO ================= */
          <form onSubmit={handleRegister} className="space-y-4">
            {registerError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm text-destructive border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {/* Nombre y Celular */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-xs font-semibold">Nombre y Apellido</Label>
                <Input
                  id="reg-name"
                  placeholder="Ej. Mario Zúñiga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone" className="text-xs font-semibold">Celular (9 dígitos)</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="958 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-xs font-semibold">Contraseña</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Mínimo 8 letras o números"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showRegisterPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showRegisterPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Ubicación de la Casa y Detección GPS */}
            <div className="space-y-2 p-3 bg-muted/60 rounded-xl border border-border/70">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-emerald-600" />
                  Ubicación de tu casa
                </Label>
                {gpsCoords && (
                  <Badge variant="success" className="text-[10px] gap-1 h-5">
                    <CheckCircle2 className="size-3" /> GPS Verificado
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {NEIGHBORHOODS.map((barrio) => (
                    <option key={barrio} value={barrio}>
                      {barrio}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDetectGps}
                  disabled={gpsLoading}
                  className="h-10 text-xs font-semibold gap-1.5 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-950/20"
                >
                  <Navigation className={`size-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                  {gpsLoading ? "Detectando GPS..." : "Detectar por GPS"}
                </Button>
              </div>

              {gpsMessage && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  {gpsMessage}
                </p>
              )}
            </div>

            {/* Selector de Perfil Comunitario */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Users className="size-3.5 text-emerald-600" />
                Selecciona tu perfil en la comunidad
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PROFILES.map((p) => {
                  const isSelected = profile === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfile(p.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-600"
                          : "border-border/70 hover:border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-9 shrink-0 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          }`}
                        >
                          <p.icon className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-bold leading-tight text-foreground">{p.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{p.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vecino Emprendedor */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold leading-tight">¿Ofreces un servicio u oficio?</p>
                  <p className="text-[10px] text-muted-foreground">Podrás publicar tu ficha en el directorio barrial</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="role-check"
                checked={role === "emprendedor"}
                onChange={(e) => setRole(e.target.checked ? "emprendedor" : "vecino")}
                className="size-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Código de la junta vecinal (solo moderadores) */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowInvite(!showInvite)}
                className="text-[11px] font-semibold text-[#087F72] hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="size-3.5" />
                ¿Eres parte de la junta vecinal?
              </button>
              {showInvite && (
                <Input
                  id="reg-invite"
                  placeholder="Código que te dio la junta"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              )}
            </div>

            <Button
              type="submit"
              disabled={registerLoading}
              className="w-full h-11 text-sm font-bold bg-[#087F72] hover:bg-[#075E54] text-white rounded-xl shadow-md transition-all active:scale-98"
            >
              {registerLoading ? "Creando cuenta..." : "Completar Registro en AYNI"}
            </Button>
          </form>
        )}

        {/* ================= PANEL SEPARADO DE EVALUACIÓN PARA JURADO ================= */}
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
