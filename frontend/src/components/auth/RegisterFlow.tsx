"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Home,
  LocateFixed,
  Lock,
  MapPin,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { NEIGHBORHOODS } from "@/lib/neighborhoods"
import { helpClass, inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/form-styles"
import { FormError } from "@/components/ui/form-error"
import { SoftBackdrop } from "@/components/layout/SoftBackdrop"
import { BigSelect } from "@/components/ui/big-select"

type Step = 1 | 2 | 3 | "done"
type GpsState = "idle" | "locating" | "ok" | "error"

function formatPhone(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join(" ")
}

function StepHeader({ step, onBack }: { step: 1 | 2 | 3; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="size-11 shrink-0 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[#1C1917] hover:border-[#087F72] transition-colors"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-[#57534E]">Paso {step} de 3</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
          {[1, 2, 3].map(n => (
            <span key={n} className={`h-1.5 rounded-full ${n <= step ? "bg-[#087F72]" : "bg-[#E7E5E4]"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 text-[15px] ${ok ? "text-[#087F72] font-semibold" : "text-[#78716C]"}`}>
      {ok ? <CheckCircle2 className="size-5 shrink-0" /> : <Circle className="size-5 shrink-0" />}
      {children}
    </li>
  )
}

export function RegisterFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [triedStep1, setTriedStep1] = useState(false)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [triedStep2, setTriedStep2] = useState(false)

  const [gps, setGps] = useState<GpsState>("idle")
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0])
  const [reference, setReference] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<{ message: string; phoneTaken?: boolean } | null>(null)

  const nameOk = name.trim().length >= 2
  const phoneOk = /^9\d{8}$/.test(phone)
  const hasLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const matches = confirm.length > 0 && confirm === password
  const firstName = name.trim().split(/\s+/)[0] || "vecino"

  const goBack = () => {
    if (step === 1) {
      if (window.history.length > 1) router.back()
      else router.push("/")
    } else if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setTriedStep1(true)
    if (nameOk && phoneOk) setStep(2)
  }

  const submitStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setTriedStep2(true)
    if (hasLength && hasNumber && matches) setStep(3)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGps("error")
      return
    }
    setGps("locating")
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGps("ok")
      },
      () => setGps("error"),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!accepted) {
      setSubmitError({ message: "Marca la casilla para aceptar las reglas de la comunidad." })
      return
    }
    setSubmitting(true)
    try {
      await authService.register({
        name: name.trim(),
        phone,
        password,
        inviteCode: showInvite ? inviteCode : undefined,
        address: {
          label: "Casa",
          neighborhood,
          reference: reference.trim() || undefined,
          latitude: coords?.lat,
          longitude: coords?.lng,
        },
      })
      setStep("done")
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && /tel[eé]fono/i.test(err.message)) {
        setSubmitError({ message: "Ese celular ya tiene una cuenta en AYNI.", phoneTaken: true })
      } else {
        setSubmitError({
          message: err instanceof ApiError ? err.friendlyMessage : "No pudimos crear tu cuenta. Intenta otra vez.",
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SoftBackdrop className="flex justify-center sm:items-center sm:p-6 font-sans text-[#1C1917]">
      <div className="w-full max-w-[440px] min-h-dvh sm:min-h-[760px] bg-white sm:rounded-2xl sm:border sm:border-border/80 sm:shadow-xl flex flex-col px-5 pt-6 pb-6">
        {step === 1 && (
          <form onSubmit={submitStep1} noValidate className="flex-1 flex flex-col">
            <StepHeader step={1} onBack={goBack} />
            <div className="flex-1 pt-7 space-y-6">
              <div>
                <h1 className="text-[28px] font-bold tracking-tight leading-tight">Cuéntanos quién eres</h1>
                <p className="mt-1.5 text-[16px] text-[#57534E]">Así te reconocerán tus vecinos.</p>
              </div>

              <div>
                <label htmlFor="reg-name" className={labelClass}>Tu nombre</label>
                <input
                  id="reg-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Ej. Rosa"
                  maxLength={120}
                  className={inputClass}
                />
                {triedStep1 && !nameOk ? (
                  <FormError>Escribe tu nombre para que tus vecinos te reconozcan.</FormError>
                ) : (
                  <p className={helpClass}>Puedes poner solo tu primer nombre.</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-phone" className={labelClass}>Tu celular</label>
                <div className="flex gap-2">
                  <span className="h-14 px-4 rounded-2xl border-2 border-[#E7E5E4] bg-white flex items-center text-[17px] font-semibold text-[#57534E]">
                    +51
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatPhone(phone)}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="987 654 321"
                    className={inputClass}
                  />
                </div>
                {triedStep1 && !phoneOk ? (
                  <FormError>Escribe tus 9 dígitos. Empieza con 9, por ejemplo 987 654 321.</FormError>
                ) : (
                  <p className={helpClass}>
                    Con este número entrarás a AYNI. No se lo mostramos a nadie sin tu permiso.
                  </p>
                )}
              </div>
            </div>
            <div className="pt-6 space-y-3">
              <button type="submit" className={primaryButton}>Continuar</button>
              <p className="text-center text-[14px] text-[#57534E]">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-bold text-[#087F72] hover:underline">Ingresa aquí</Link>
              </p>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitStep2} noValidate className="flex-1 flex flex-col">
            <StepHeader step={2} onBack={goBack} />
            <div className="flex-1 pt-7 space-y-6">
              <div>
                <h1 className="text-[28px] font-bold tracking-tight leading-tight">Crea tu contraseña</h1>
                <p className="mt-1.5 text-[16px] text-[#57534E]">La usarás junto con tu celular para entrar.</p>
              </div>

              <div>
                <label htmlFor="reg-password" className={labelClass}>Contraseña</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    maxLength={72}
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
                <ul className="mt-3 space-y-1.5" aria-live="polite">
                  <Rule ok={hasLength}>Tiene 8 letras o números</Rule>
                  <Rule ok={hasNumber}>Tiene al menos un número</Rule>
                </ul>
              </div>

              <div>
                <label htmlFor="reg-confirm" className={labelClass}>Escríbela otra vez</label>
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  maxLength={72}
                  className={inputClass}
                />
                <ul className="mt-3" aria-live="polite">
                  <Rule ok={matches}>Las dos son iguales</Rule>
                </ul>
              </div>

              <div className="rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-4 text-[15px] leading-snug text-[#78350F]">
                <strong>Consejo:</strong> piensa en algo que solo tú sepas, como tu flor favorita y un año.
              </div>

              {triedStep2 && !(hasLength && hasNumber && matches) && (
                <FormError>Revisa los puntos que siguen en gris.</FormError>
              )}
            </div>
            <div className="pt-6">
              <button type="submit" className={primaryButton}>Continuar</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitStep3} noValidate className="flex-1 flex flex-col">
            <StepHeader step={3} onBack={goBack} />
            <div className="flex-1 pt-7 space-y-5">
              <div>
                <h1 className="text-[28px] font-bold tracking-tight leading-tight">¿Dónde vives?</h1>
                <p className="mt-1.5 text-[16px] text-[#57534E]">Así te mostramos lo que hay cerca de tu casa.</p>
              </div>

              <button
                type="button"
                onClick={detectLocation}
                disabled={gps === "locating"}
                className="w-full h-14 rounded-2xl border-2 border-[#087F72] bg-[#EAF5F1] text-[#087F72] text-[17px] font-bold flex items-center justify-center gap-2 hover:bg-[#d4f3eb] transition-colors disabled:opacity-60"
              >
                <LocateFixed className={`size-5 ${gps === "locating" ? "animate-pulse" : ""}`} />
                {gps === "locating" ? "Buscando tu ubicación…" : gps === "ok" ? "Ubicación lista" : "Usar mi ubicación actual"}
              </button>

              <div className="relative h-40 rounded-2xl overflow-hidden bg-[#E7E5E4] border border-[#E7E5E4]" aria-hidden="true">
                <span className="absolute -left-6 top-14 w-[130%] h-6 bg-white rotate-[-12deg]" />
                <span className="absolute left-24 -top-6 w-6 h-[140%] bg-white rotate-[8deg]" />
                <span className="absolute right-16 -top-6 w-5 h-[140%] bg-white" />
                <span className="absolute right-3 top-3 w-20 h-14 rounded-lg bg-[#CDE8D6]" />
                <MapPin
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full size-9 text-[#087F72] drop-shadow"
                  fill="#087F72"
                  stroke="white"
                />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-[12px] font-semibold text-[#44403C] shadow-sm">
                  {gps === "ok" ? "Encontramos tu ubicación" : "Tu ubicación exacta no se comparte"}
                </span>
              </div>
              {gps === "error" && (
                <FormError>No pudimos obtener tu ubicación. No pasa nada: elige tu barrio aquí abajo.</FormError>
              )}

              <div>
                <label htmlFor="reg-barrio" className={labelClass}>Tu barrio</label>
                <BigSelect
                  id="reg-barrio"
                  value={neighborhood}
                  onValueChange={setNeighborhood}
                  options={NEIGHBORHOODS.map(n => ({ value: n, label: n }))}
                  icon={Home}
                />
              </div>

              <div>
                <label htmlFor="reg-reference" className={labelClass}>
                  Referencia <span className="font-normal text-[#78716C]">(opcional)</span>
                </label>
                <input
                  id="reg-reference"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ej. Cerca al parque principal"
                  maxLength={200}
                  className={inputClass}
                />
                <p className={helpClass}>Podrás agregar más direcciones después, como la casa de un familiar.</p>
              </div>

              <p className="flex items-start gap-2 text-[14px] leading-snug text-[#57534E]">
                <Lock className="size-4 mt-0.5 shrink-0" />
                Tus vecinos solo verán tu barrio, nunca la dirección exacta de tu casa.
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-0.5 size-6 shrink-0 accent-[#087F72] cursor-pointer"
                />
                <span className="text-[15px] leading-snug">
                  Acepto las <strong className="text-[#087F72]">reglas de la comunidad</strong> y la{" "}
                  <strong className="text-[#087F72]">política de privacidad</strong>.
                </span>
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => setShowInvite(!showInvite)}
                  className="text-[14px] font-semibold text-[#087F72] hover:underline"
                >
                  ¿Eres parte de la junta vecinal?
                </button>
                {showInvite && (
                  <input
                    aria-label="Código de la junta vecinal"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value)}
                    placeholder="Código que te dio la junta"
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>

              {submitError && (
                <div>
                  <FormError>{submitError.message}</FormError>
                  {submitError.phoneTaken && (
                    <div className="mt-2 flex gap-4 text-[14px] font-bold">
                      <Link href="/login" className="text-[#087F72] hover:underline">Ingresar con ese número</Link>
                      <button type="button" onClick={() => setStep(1)} className="text-[#087F72] hover:underline">
                        Usar otro celular
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="pt-6">
              <button type="submit" disabled={submitting} className={primaryButton}>
                {submitting ? "Creando tu cuenta…" : "Crear mi cuenta"}
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center pt-8">
              <div className="size-28 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                <Check className="size-14 text-[#087F72]" strokeWidth={2.5} />
              </div>
              <h1 className="mt-3 text-[32px] font-bold tracking-tight">¡Listo, {firstName}!</h1>
              <p className="text-[17px] leading-snug text-[#44403C]">
                Ya eres parte de la comunidad de {neighborhood}.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-white border border-[#E7E5E4] p-4 space-y-3">
              <div>
                <p className="text-[17px] font-bold">¿Te mostramos cómo funciona?</p>
                <p className="text-[15px] text-[#57534E]">Son 3 pasos cortos, menos de 1 minuto.</p>
              </div>
              <ol className="grid grid-cols-3 gap-2">
                {[
                  { n: 1, label: "Busca", amber: false },
                  { n: 2, label: "Publica", amber: true },
                  { n: 3, label: "Ayuda", amber: false },
                ].map(s => (
                  <li
                    key={s.n}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-[14px] font-semibold ${
                      s.amber ? "bg-[#FEF3C7] text-[#78350F]" : "bg-[#F0FDFA] text-[#115E59]"
                    }`}
                  >
                    <span
                      className={`size-7 rounded-full flex items-center justify-center text-white text-[14px] font-bold ${
                        s.amber ? "bg-[#B45309]" : "bg-[#087F72]"
                      }`}
                    >
                      {s.n}
                    </span>
                    {s.label}
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-6 space-y-3">
              <button type="button" onClick={() => router.push("/")} className={primaryButton}>
                Ver cómo funciona
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className={secondaryButton}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </SoftBackdrop>
  )
}
