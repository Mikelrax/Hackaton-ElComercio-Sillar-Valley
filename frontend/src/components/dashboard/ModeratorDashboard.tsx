"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Home,
  LogOut,
  MapPin,
  Menu,
  PhoneCall,
  Plus,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Siren,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { User } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { AdminUser, emergencyApi } from "@/lib/emergency";
import { formatDistance, useCatalog } from "@/lib/catalog";
import { timeAgo } from "@/lib/posts";
import { EmergencyOverview, EmergencyReport, ModerationStats } from "@/lib/types";
import { PendingPostsPanel } from "@/components/dashboard/PendingPostsPanel";
import { BigSelect } from "@/components/ui/big-select";
import { Spot } from "@/lib/types";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-60 rounded-2xl bg-gray-100 animate-pulse" />,
});

interface ModeratorDashboardProps {
  user: User;
  onLogout: () => void;
}

type Section = "dashboard" | "posts" | "reports" | "resources" | "users" | "emergency";

const SIDEBAR_ITEMS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Panel general", icon: Home },
  { id: "posts", label: "Por aprobar", icon: CheckCircle2 },
  { id: "reports", label: "Reportes de emergencia", icon: AlertTriangle },
  { id: "resources", label: "Puntos de apoyo", icon: MapPin },
  { id: "users", label: "Vecinos", icon: Users },
  { id: "emergency", label: "Modo emergencia", icon: Siren },
];

const SEVERITY_STYLE: Record<EmergencyReport["severity"], string> = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-emerald-100 text-emerald-700",
};

const STATUS_STYLE: Record<EmergencyReport["status"], string> = {
  URGENT: "bg-rose-50 text-rose-700",
  ON_THE_WAY: "bg-amber-50 text-amber-800",
  ATTENDED: "bg-emerald-50 text-emerald-800",
};

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.friendlyMessage : "Algo salió mal. Intenta otra vez.";
}

function Loading({ label }: { label: string }) {
  return (
    <div className="py-6 flex items-center gap-2 text-xs text-gray-500">
      <div className="size-4 rounded-full border-2 border-[#087F72] border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

function SectionHeader({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      {onRefresh && (
        <button onClick={onRefresh} className="text-xs font-semibold text-[#087F72] hover:underline flex items-center gap-1">
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      )}
    </div>
  );
}

function ReportCard({ report, onAction, busy }: { report: EmergencyReport; busy: boolean; onAction: (kind: "verify" | "attended") => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold flex items-center gap-1.5">
            {report.title}
            {report.verified && <BadgeCheck className="size-4 text-[#087F72]" aria-label="Verificado" />}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="size-3" />
            {report.neighborhood} · {report.categoryLabel} · {report.kindLabel}
          </p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${SEVERITY_STYLE[report.severity]}`}>
          {report.severityLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo(report.createdAt)}
        </span>
        <span>Reportó: {report.reporter}{report.reporterPhone ? ` · +${report.reporterPhone}` : ""}</span>
        {report.helper && <span>Ayuda: {report.helper}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${STATUS_STYLE[report.status]}`}>{report.statusLabel}</span>
        <div className="flex-1" />
        {!report.verified && (
          <button
            disabled={busy}
            onClick={() => onAction("verify")}
            className="h-8 px-3 rounded-lg border border-[#087F72] text-[#087F72] text-xs font-bold disabled:opacity-60"
          >
            Verificar
          </button>
        )}
        {report.status !== "ATTENDED" && (
          <button
            disabled={busy}
            onClick={() => onAction("attended")}
            className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"
          >
            Marcar atendido
          </button>
        )}
      </div>
    </div>
  );
}

export function ModeratorDashboard({ user, onLogout }: ModeratorDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { catalog } = useCatalog();

  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [overview, setOverview] = useState<EmergencyOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [modeTitle, setModeTitle] = useState("");
  const [modeMessage, setModeMessage] = useState("");
  const [pointName, setPointName] = useState("");
  const [pointType, setPointType] = useState("");
  const [pointAddress, setPointAddress] = useState("");
  const [pointFormOpen, setPointFormOpen] = useState(false);
  const [pointSpot, setPointSpot] = useState<Spot | null>(null);
  const [pointError, setPointError] = useState("");
  const [confirming, setConfirming] = useState<"activate" | "deactivate" | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([emergencyApi.stats(), emergencyApi.overview(user.location), emergencyApi.users()])
      .then(([s, o, u]) => {
        if (cancelled) return;
        setStats(s);
        setOverview(o);
        setUsers(u);
        setError("");
      })
      .catch(err => {
        if (!cancelled) setError(errorText(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, user.location]);

  const refresh = () => setReloadKey(k => k + 1);

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusyKey(key);
    setError("");
    try {
      await action();
      refresh();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const mode = overview?.mode;
  const pendingReports = overview?.reports.filter(r => r.status !== "ATTENDED") ?? [];
  const supportTypes = catalog?.supportPointTypes ?? [];
  const currentPointType = pointType || supportTypes[0]?.value || "";

  const go = (section: Section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    setConfirming(null);
  };

  const navButtons = (onPick: (s: Section) => void) =>
    SIDEBAR_ITEMS.map(item => {
      const Icon = item.icon;
      const isActive = activeSection === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onPick(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive ? "bg-[#EAF5F1] text-[#087F72] font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-[#172B2A]"
          }`}
        >
          <Icon className="size-4" />
          <span>{item.label}</span>
          {item.id === "reports" && pendingReports.length > 0 && (
            <span className="ml-auto rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5">
              {pendingReports.length}
            </span>
          )}
        </button>
      );
    });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-[#172B2A] antialiased">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <button onClick={() => go("dashboard")} className="flex items-center hover:opacity-85" title="Ir al panel general">
            <Logo size="md" />
          </button>
          <div className="mt-3 flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#087F72] text-white flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{user.name}</p>
              <p className="text-[11px] text-gray-500 flex items-center gap-0.5">
                <Shield className="size-3" />
                Moderador
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">{navButtons(go)}</nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 h-10 rounded-xl text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => go("dashboard")} className="flex items-center" title="Ir al panel general">
            <Logo size="sm" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú"
            className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
            {navButtons(go)}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Panel de moderador</h1>
              <p className="text-xs text-gray-500 mt-0.5">Gestión comunitaria · {user.location.neighborhood}</p>
            </div>
            <button
              onClick={() => go("emergency")}
              className={`h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm ${
                mode?.active ? "bg-rose-600 text-white" : "border border-rose-400 text-rose-600 hover:bg-rose-50"
              }`}
            >
              {mode?.active ? <Siren className="size-4" /> : <ShieldAlert className="size-4" />}
              {mode?.active ? `Emergencia activa: ${mode.title}` : "Activar modo emergencia"}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

          {activeSection === "dashboard" && (
            <>
              {!stats ? (
                <Loading label="Cargando resumen…" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Reportes sin cerrar", value: stats.activeReports, icon: AlertTriangle, tone: "bg-rose-100 text-rose-600", to: "reports" as Section },
                    { label: "Puntos de apoyo abiertos", value: stats.openSupportPoints, icon: MapPin, tone: "bg-emerald-100 text-emerald-600", to: "resources" as Section },
                    { label: "Vecinos registrados", value: stats.users, icon: Users, tone: "bg-blue-100 text-blue-600", to: "users" as Section },
                    { label: "Estado de la zona", value: stats.emergencyActive ? "Emergencia" : "Normal", icon: Radio, tone: "bg-amber-100 text-amber-600", to: "emergency" as Section },
                  ].map(card => (
                    <button
                      key={card.label}
                      onClick={() => go(card.to)}
                      className="text-left bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:border-[#087F72]/50"
                    >
                      <span className={`size-8 rounded-lg flex items-center justify-center mb-2 ${card.tone}`}>
                        <card.icon className="size-4" />
                      </span>
                      <p className="text-2xl font-extrabold">{card.value}</p>
                      <p className="text-[11px] text-gray-500">{card.label}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <SectionHeader title="Reportes sin atender" />
                {overview && pendingReports.length === 0 && (
                  <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-4">No hay reportes abiertos.</p>
                )}
                {pendingReports.slice(0, 3).map(r => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    busy={busyKey === `r-${r.id}`}
                    onAction={kind =>
                      run(`r-${r.id}`, () => (kind === "verify" ? emergencyApi.verify(r.id) : emergencyApi.attended(r.id)))
                    }
                  />
                ))}
              </div>

              {(catalog?.emergencyNumbers.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <PhoneCall className="size-4 text-[#087F72]" />
                    Números de emergencia
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catalog?.emergencyNumbers.map(n => (
                      <a key={n.value} href={`tel:${n.value}`} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold">
                        {n.label}: {n.value}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeSection === "posts" && <PendingPostsPanel />}

          {activeSection === "reports" && (
            <div className="space-y-4">
              <SectionHeader title="Reportes de emergencia" onRefresh={refresh} />
              {!overview && <Loading label="Cargando reportes…" />}
              {overview?.reports.length === 0 && (
                <p className="text-sm text-gray-500 bg-white rounded-2xl border border-gray-200 p-4">Todavía no hay reportes.</p>
              )}
              {overview?.reports.map(r => (
                <ReportCard
                  key={r.id}
                  report={r}
                  busy={busyKey === `r-${r.id}`}
                  onAction={kind =>
                    run(`r-${r.id}`, () => (kind === "verify" ? emergencyApi.verify(r.id) : emergencyApi.attended(r.id)))
                  }
                />
              ))}
            </div>
          )}

          {activeSection === "resources" && (
            <div className="space-y-4">
              <SectionHeader title="Puntos de apoyo" onRefresh={refresh} />
              {!overview && <Loading label="Cargando puntos…" />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {overview?.supportPoints.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {p.typeLabel} · {p.address ?? p.neighborhood}
                          {p.distanceMeters !== null && ` · ${formatDistance(p.distanceMeters)}`}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${p.open ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                        {p.open ? "Abierto" : "Cerrado"}
                      </span>
                    </div>
                    <button
                      disabled={busyKey !== null}
                      onClick={() => run(`p-${p.id}`, () => emergencyApi.setSupportPointOpen(p.id, !p.open))}
                      className="text-xs font-bold text-[#087F72] hover:underline disabled:opacity-60"
                    >
                      {p.open ? "Marcar como cerrado" : "Marcar como abierto"}
                    </button>
                  </div>
                ))}
              </div>

              {pointFormOpen ? (
                <form
                  className="bg-white rounded-2xl border-2 border-[#087F72]/40 p-4 space-y-3"
                  onSubmit={async e => {
                    e.preventDefault();
                    setPointError("");
                    if (!pointSpot) {
                      setPointError("Marca el punto en el mapa: muévelo, busca la calle o toca «Usar mi ubicación».");
                      return;
                    }
                    const ok = await run("new-point", () =>
                      emergencyApi.addSupportPoint({
                        name: pointName.trim(),
                        type: currentPointType,
                        address: pointAddress.trim() || undefined,
                        latitude: pointSpot.latitude,
                        longitude: pointSpot.longitude,
                      })
                    );
                    if (ok) {
                      setPointName("");
                      setPointAddress("");
                      setPointSpot(null);
                      setPointFormOpen(false);
                    }
                  }}
                >
                  <p className="text-base font-bold">Nuevo punto de apoyo</p>
                  <input
                    required
                    value={pointName}
                    onChange={e => setPointName(e.target.value)}
                    placeholder="Nombre, ej. Albergue Colegio San José"
                    aria-label="Nombre del punto"
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm"
                  />
                  <BigSelect
                    value={currentPointType}
                    onValueChange={setPointType}
                    options={supportTypes.map(t => ({ value: t.value, label: t.label }))}
                    ariaLabel="Tipo de punto"
                    placeholder="Cargando tipos…"
                  />
                  <input
                    value={pointAddress}
                    onChange={e => setPointAddress(e.target.value)}
                    placeholder="Dirección o referencia (opcional)"
                    aria-label="Dirección"
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">¿Dónde queda?</p>
                    {catalog ? (
                      <LocationPicker
                        styleUrl={catalog.map.styleUrl}
                        start={{ lat: user.location.lat, lng: user.location.lng }}
                        startZoom={15}
                        onChange={setPointSpot}
                      />
                    ) : (
                      <div className="h-60 rounded-2xl bg-gray-100 animate-pulse" />
                    )}
                  </div>
                  {pointError && <p className="text-xs font-semibold text-rose-600">{pointError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busyKey !== null || !pointName.trim()}
                      className="h-10 px-4 rounded-xl bg-[#087F72] text-white text-sm font-bold disabled:opacity-60"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPointFormOpen(false);
                        setPointSpot(null);
                        setPointError("");
                      }}
                      className="h-10 px-4 rounded-xl border border-gray-300 text-sm font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setPointFormOpen(true)}
                  className="h-11 px-4 rounded-xl border-2 border-[#087F72] text-[#087F72] text-sm font-bold flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  Agregar punto de apoyo
                </button>
              )}
            </div>
          )}

          {activeSection === "users" && (
            <div className="space-y-4">
              <SectionHeader title="Vecinos registrados" onRefresh={refresh} />
              {!users && <Loading label="Cargando vecinos…" />}
              {users && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                        <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Barrio</th>
                        <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Rol</th>
                        <th className="text-left px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{u.fullName}</p>
                            <p className="text-[11px] text-gray-400">+{u.phone} · {u.ayniPoints} puntos ayni</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.primaryAddress?.neighborhood ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.role === "MODERATOR" ? "Moderador" : "Vecino"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${u.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                              {u.active ? "Activo" : "Desactivado"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {u.role !== "MODERATOR" && (
                              <button
                                disabled={busyKey !== null}
                                onClick={() => run(`u-${u.id}`, () => emergencyApi.setUserActive(u.id, !u.active))}
                                className="text-xs font-bold text-[#087F72] hover:underline disabled:opacity-60"
                              >
                                {u.active ? "Desactivar" : "Activar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === "emergency" && (
            <div className="space-y-4 max-w-xl">
              <SectionHeader title="Modo emergencia" />
              {!overview && <Loading label="Cargando estado…" />}
              {mode?.active && (
                <div className="bg-rose-600 text-white rounded-2xl p-5 space-y-3">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Siren className="size-5" />
                    Emergencia activa: {mode.title}
                  </p>
                  {mode.message && <p className="text-sm text-rose-50">{mode.message}</p>}
                  <p className="text-xs text-rose-100">
                    Activada por {mode.activatedBy} · {mode.activatedAt && timeAgo(mode.activatedAt)}
                  </p>
                  {confirming === "deactivate" ? (
                    <div className="rounded-xl bg-white/10 border border-white/30 p-3 space-y-2" role="alertdialog" aria-label="Confirmar desactivación">
                      <p className="text-sm font-bold">¿Desactivar el modo emergencia?</p>
                      <p className="text-xs text-rose-50">
                        Los vecinos dejarán de ver el aviso rojo y la app volverá al modo cotidiano.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busyKey !== null}
                          onClick={async () => {
                            const ok = await run("deactivate", () => emergencyApi.deactivate());
                            if (ok) setConfirming(null);
                          }}
                          className="h-10 px-4 rounded-xl bg-white text-rose-700 text-sm font-bold disabled:opacity-60"
                        >
                          {busyKey === "deactivate" ? "Desactivando…" : "Sí, desactivar"}
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="h-10 px-4 rounded-xl border border-white/70 text-white text-sm font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={busyKey !== null}
                      onClick={() => setConfirming("deactivate")}
                      className="h-10 px-4 rounded-xl bg-white text-rose-700 text-sm font-bold disabled:opacity-60"
                    >
                      Desactivar modo emergencia
                    </button>
                  )}
                </div>
              )}
              {overview && !mode?.active && (
                <form
                  className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (confirming !== "activate") {
                      setConfirming("activate");
                      return;
                    }
                    const ok = await run("activate", () => emergencyApi.activate(modeTitle.trim(), modeMessage.trim() || undefined));
                    if (ok) {
                      setModeTitle("");
                      setModeMessage("");
                      setConfirming(null);
                    }
                  }}
                >
                  <p className="text-sm text-gray-600">
                    Al activarlo, todos los vecinos verán un aviso rojo y la pantalla de emergencia con reportes y puntos de apoyo.
                  </p>
                  <input
                    required
                    value={modeTitle}
                    onChange={e => setModeTitle(e.target.value)}
                    maxLength={80}
                    placeholder="¿Qué pasa? Ej. Sismo, lluvias fuertes, incendio"
                    aria-label="Tipo de emergencia"
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm"
                  />
                  <textarea
                    value={modeMessage}
                    onChange={e => setModeMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Mensaje para los vecinos (opcional)"
                    aria-label="Mensaje para los vecinos"
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm resize-none"
                  />
                  {confirming === "activate" ? (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2" role="alertdialog" aria-label="Confirmar activación">
                      <p className="text-sm font-bold text-rose-800">
                        ¿Activar «{modeTitle.trim()}» para toda la zona?
                      </p>
                      <p className="text-xs text-rose-700">
                        Todos los vecinos verán el aviso rojo y la pantalla de emergencia en cuanto abran o usen la app.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={busyKey !== null || !modeTitle.trim()}
                          className="h-10 px-4 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                        >
                          <Siren className="size-4" />
                          {busyKey === "activate" ? "Activando…" : "Sí, activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="h-10 px-4 rounded-xl border border-gray-300 bg-white text-sm font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={busyKey !== null || !modeTitle.trim()}
                      className="h-11 px-5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                    >
                      <Siren className="size-4" />
                      Activar modo emergencia
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
