"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Plus, Star } from "lucide-react"
import { Address, authService } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { addressesApi } from "@/lib/addresses"
import { useCatalog } from "@/lib/catalog"
import { Spot } from "@/lib/types"
import { helpClass, inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/form-styles"
import { FormError } from "@/components/ui/form-error"
import { SoftBackdrop } from "@/components/layout/SoftBackdrop"
import { BigSelect, type BigSelectOption } from "@/components/ui/big-select"
import { CategoryIcon } from "@/components/ui/category-icon"

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-72 rounded-2xl bg-[#E7E5E4] animate-pulse" />,
})

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez."
}

function AddressForm({
  start,
  onSaved,
  onCancel,
}: {
  start: { lat: number; lng: number } | null
  onSaved: () => void
  onCancel: () => void
}) {
  const { catalog } = useCatalog()
  const places = catalog?.addressPlaces ?? []
  const placeOptions: BigSelectOption[] = places.map(p => ({ value: p.value, label: p.label, iconName: p.icon }))
  const [chosenPlace, setPlace] = useState("")
  const place = places.find(p => p.value === chosenPlace) ?? places[0]
  const [customLabel, setCustomLabel] = useState("")
  const [reference, setReference] = useState("")
  const [spot, setSpot] = useState<Spot | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const label = place?.custom ? customLabel.trim() : place?.label ?? ""
    if (!label) {
      setError("Escribe un nombre para este lugar, por ejemplo «Casa de mi abuela».")
      return
    }
    if (!spot) {
      setError("Marca el lugar en el mapa: muévelo con el dedo, busca la calle o toca «Usar mi ubicación».")
      return
    }
    setSaving(true)
    try {
      await addressesApi.add({
        label,
        reference: reference.trim() || undefined,
        latitude: spot.latitude,
        longitude: spot.longitude,
      })
      onSaved()
    } catch (err) {
      setError(errorText(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl bg-white border-2 border-[#087F72]/40 p-4 space-y-5">
      <h2 className="text-[20px] font-bold">Nueva dirección</h2>

      <div>
        <label htmlFor="addr-place" className={labelClass}>¿Qué lugar es?</label>
        <BigSelect
          id="addr-place"
          value={place?.value ?? ""}
          onValueChange={setPlace}
          options={placeOptions}
          placeholder="Cargando lugares…"
        />
        {place?.custom && (
          <input
            aria-label="Nombre del lugar"
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder="Ej. Casa de mi abuela"
            maxLength={40}
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div>
        <p className={labelClass}>¿Dónde queda?</p>
        {catalog ? (
          <LocationPicker
            styleUrl={catalog.map.styleUrl}
            start={start ?? { lat: catalog.city.latitude, lng: catalog.city.longitude }}
            startZoom={start ? 14 : 13}
            large
            onChange={setSpot}
          />
        ) : (
          <div className="h-72 rounded-2xl bg-[#E7E5E4] animate-pulse" />
        )}
      </div>

      <div>
        <label htmlFor="addr-reference" className={labelClass}>
          Referencia <span className="font-normal text-[#78716C]">(opcional)</span>
        </label>
        <input
          id="addr-reference"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="Ej. Frente a la iglesia"
          maxLength={200}
          className={inputClass}
        />
      </div>

      {error && <FormError>{error}</FormError>}

      <div className="space-y-2">
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? "Guardando…" : "Guardar dirección"}
        </button>
        <button type="button" onClick={onCancel} className="w-full h-12 text-[16px] font-semibold text-[#57534E] hover:text-[#1C1917]">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function AddressesView() {
  const router = useRouter()
  const { catalog } = useCatalog()
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!authService.getCurrentUser()) {
      router.replace("/login")
      return
    }
    let cancelled = false
    addressesApi
      .list()
      .then(list => {
        if (cancelled) return
        setAddresses(list)
        setError("")
        authService.refreshLocation().catch(() => {})
      })
      .catch(err => {
        if (!cancelled) setError(errorText(err))
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey, router])

  const refresh = () => setReloadKey(k => k + 1)

  const run = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusyId(id)
    setError("")
    setNotice("")
    try {
      await action()
      setConfirmDeleteId(null)
      setNotice(message)
      refresh()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusyId(null)
    }
  }

  const count = addresses?.length ?? 0
  const primaryAddress = addresses?.find(a => a.primary)
  const primaryPoint = primaryAddress ? { lat: primaryAddress.latitude, lng: primaryAddress.longitude } : null
  const maxAddresses = catalog?.maxAddresses ?? null

  return (
    <SoftBackdrop className="flex justify-center font-sans text-[#1C1917]">
      <div className="w-full max-w-[480px] px-5 pt-6 pb-12 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="size-11 shrink-0 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center hover:border-[#087F72] transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <span className="text-[15px] font-semibold text-[#57534E]">Volver al inicio</span>
        </div>

        <div>
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">Mis direcciones</h1>
          <p className="mt-1.5 text-[16px] text-[#57534E]">
            Guarda tu casa y otros lugares donde pasas tiempo, como la casa de un familiar.
          </p>
        </div>

        <p className="flex items-start gap-2 text-[14px] leading-snug text-[#57534E]">
          <Lock className="size-4 mt-0.5 shrink-0" />
          Tus vecinos solo ven el barrio, nunca la dirección exacta. La principal es la que usamos para mostrarte lo que hay cerca.
        </p>

        {notice && (
          <p className="rounded-xl bg-[#EAF5F1] border border-[#087F72]/30 p-3 text-[15px] font-semibold text-[#087F72]" role="status">
            {notice}
          </p>
        )}
        {error && <FormError>{error}</FormError>}

        {!addresses && !error && (
          <div className="py-6 flex items-center gap-2 text-[15px] text-[#57534E]">
            <div className="size-5 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
            Cargando tus direcciones…
          </div>
        )}

        {addresses && (
          <ul className="space-y-3">
            {addresses.map(address => {
              const isBusy = busyId === address.id
              return (
                <li key={address.id} className="rounded-2xl bg-white border border-[#E7E5E4] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="size-11 shrink-0 rounded-full bg-[#EAF5F1] text-[#087F72] flex items-center justify-center">
                      <CategoryIcon name={address.icon} className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[17px] font-bold">{address.label}</p>
                        {address.primary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#087F72] px-2.5 py-0.5 text-[12px] font-bold text-white">
                            <Star className="size-3" fill="white" />
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[15px] text-[#44403C]">{address.neighborhood}</p>
                      {address.reference && <p className="text-[14px] text-[#78716C]">{address.reference}</p>}
                    </div>
                  </div>

                  {confirmDeleteId === address.id ? (
                    <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3 space-y-2">
                      <p className="text-[15px] font-semibold text-[#991B1B]">¿Borrar «{address.label}»?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => run(address.id, () => addressesApi.remove(address.id), "Dirección borrada.")}
                          className="h-11 px-4 rounded-xl bg-[#B91C1C] text-white text-[15px] font-bold disabled:opacity-60"
                        >
                          {isBusy ? "Borrando…" : "Sí, borrar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-11 px-4 rounded-xl border border-[#E7E5E4] bg-white text-[15px] font-semibold"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pl-14">
                      {!address.primary && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            run(
                              address.id,
                              () => addressesApi.makePrimary(address.id),
                              `«${address.label}» es ahora tu dirección principal.`
                            )
                          }
                          className="text-[15px] font-bold text-[#087F72] hover:underline disabled:opacity-60"
                        >
                          {isBusy ? "Guardando…" : "Usar como principal"}
                        </button>
                      )}
                      {count > 1 && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => setConfirmDeleteId(address.id)}
                          className="text-[15px] font-semibold text-[#B91C1C] hover:underline disabled:opacity-60"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {addresses && formOpen && (
          <AddressForm
            start={primaryPoint}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false)
              setNotice("Dirección guardada.")
              refresh()
            }}
          />
        )}

        {addresses && !formOpen && maxAddresses !== null && count < maxAddresses && (
          <button
            type="button"
            onClick={() => {
              setNotice("")
              setFormOpen(true)
            }}
            className={`${secondaryButton} flex items-center justify-center gap-2`}
          >
            <Plus className="size-5" />
            Agregar otra dirección
          </button>
        )}

        {addresses && maxAddresses !== null && count >= maxAddresses && (
          <p className={helpClass}>Puedes guardar hasta {maxAddresses} direcciones. Borra una para agregar otra.</p>
        )}
      </div>
    </SoftBackdrop>
  )
}
