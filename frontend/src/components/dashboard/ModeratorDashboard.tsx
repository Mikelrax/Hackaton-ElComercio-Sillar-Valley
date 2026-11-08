"use client";

import * as React from "react";
import { useState } from "react";
import {
  ShieldAlert,
  MapPin,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Home,
  Menu,
  X,
  Flame,
  Droplet,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  Clock,
  Eye,
  Radio,
  Shield,
  Waves,
  Package,
  Hospital,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import { User } from "@/lib/auth";
import { PendingPostsPanel } from "@/components/dashboard/PendingPostsPanel";

interface ModeratorDashboardProps {
  user: User;
  onLogout: () => void;
}

const DEMO_REPORTS = [
  {
    id: 1,
    type: "Incendio forestal",
    icon: Flame,
    iconClass: "bg-rose-50 text-rose-600",
    severity: "alta",
    location: "Cerro Colorado, Sector 5",
    time: "Hace 10 min",
    status: "pendiente",
    reporter: "María Quispe",
  },
  {
    id: 2,
    type: "Inundación parcial",
    icon: Waves,
    iconClass: "bg-sky-50 text-sky-600",
    severity: "media",
    location: "Calle Antiquilla, Yanahuara",
    time: "Hace 35 min",
    status: "verificado",
    reporter: "Carlos Medina",
  },
  {
    id: 3,
    type: "Derrumbe menor",
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600",
    severity: "baja",
    location: "Av. Ejército cuadra 8",
    time: "Hace 2 horas",
    status: "resuelto",
    reporter: "Junta Vecinal Sector 3",
  },
];

const DEMO_RESOURCES = [
  { id: 1, name: "Punto de agua potable", location: "Plaza Yanahuara", status: "activo", icon: Droplet, iconClass: "bg-sky-50 text-sky-600" },
  { id: 2, name: "Centro de acopio", location: "Colegio San José", status: "activo", icon: Package, iconClass: "bg-amber-50 text-amber-600" },
  { id: 3, name: "Albergue temporal", location: "Polideportivo Municipal", status: "preparado", icon: Home, iconClass: "bg-emerald-50 text-emerald-600" },
  { id: 4, name: "Botiquín comunitario", location: "Calle Los Arcos 210", status: "activo", icon: Hospital, iconClass: "bg-rose-50 text-rose-600" },
];

const DEMO_USERS = [
  { id: 1, name: "Ana María Condori", role: "vecino", profile: "familia", neighborhood: "Yanahuara", status: "verificado" },
  { id: 2, name: "Don Mario Zúñiga", role: "emprendedor", profile: "adulto", neighborhood: "Yanahuara", status: "verificado" },
  { id: 3, name: "Carmen Flores", role: "vecino", profile: "mayor", neighborhood: "Cayma", status: "pendiente" },
];

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Panel General", icon: Home },
  { id: "posts", label: "Muro: por aprobar", icon: CheckCircle2 },
  { id: "reports", label: "Reportes de Emergencia", icon: AlertTriangle },
  { id: "resources", label: "Recursos Críticos", icon: MapPin },
  { id: "users", label: "Gestión de Usuarios", icon: Users },
  { id: "settings", label: "Configuración", icon: Settings },
];

function severityColor(severity: string) {
  switch (severity) {
    case "alta":
      return "bg-rose-100 text-rose-700 border-rose-300";
    case "media":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "baja":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "pendiente":
      return "bg-amber-100 text-amber-800";
    case "verificado":
      return "bg-blue-100 text-blue-800";
    case "resuelto":
      return "bg-emerald-100 text-emerald-800";
    case "activo":
      return "bg-emerald-100 text-emerald-800";
    case "preparado":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function ModeratorDashboard({ user, onLogout }: ModeratorDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-[#172B2A] antialiased">
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <button
            onClick={() => setActiveSection("dashboard")}
            className="flex items-center text-left hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
            title="Ir al Panel General"
          >
            <Logo size="md" />
          </button>
          <div className="mt-3 flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#087F72] text-white flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-[#172B2A] leading-tight">{user.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">
                <Shield className="size-3 inline mr-0.5" />
                {user.role}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#EAF5F1] text-[#087F72] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#172B2A]"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {item.id === "reports" && (
                  <Badge className="ml-auto bg-rose-100 text-rose-700 border-0 text-[10px] h-5">
                    {DEMO_REPORTS.filter((r) => r.status === "pendiente").length}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-gray-500 hover:text-rose-600 hover:bg-rose-50 h-10 rounded-xl"
          >
            <LogOut className="size-4 mr-2" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              setActiveSection("dashboard")
              setMobileMenuOpen(false)
            }}
            className="flex items-center text-left hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
            title="Ir al Panel General"
          >
            <Logo size="sm" />
          </button>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#EAF5F1] text-[#087F72] border-0 text-[10px]">
              <Shield className="size-3 mr-1" />
              Moderador
            </Badge>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#EAF5F1] text-[#087F72] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#172B2A]">
                Panel de Moderador
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Gestión comunitaria · {user.location?.neighborhood || "Arequipa"}
              </p>
            </div>
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`h-9 px-4 rounded-xl font-bold text-xs gap-1.5 transition-all shadow-sm ${
                emergencyMode
                  ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                  : "border-rose-400 text-rose-600 hover:bg-rose-50"
              }`}
            >
              {emergencyMode ? <Siren className="size-4" /> : <ShieldAlert className="size-4" />}
              {emergencyMode ? "MODO SOS ACTIVO" : "Activar Modo Emergencia"}
            </Button>
          </div>
        </div>

        {emergencyMode && (
          <div className="bg-rose-600 text-white px-4 py-3">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <Flame className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">ALERTA COMUNITARIA ACTIVA</p>
                <p className="text-xs text-rose-100">
                  Tablero humanitario activado para {user.location?.neighborhood || "tu zona"}.
                  Todos los vecinos verán el modo emergencia.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {activeSection === "dashboard" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="size-4 text-rose-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-[#172B2A]">{DEMO_REPORTS.length}</p>
                  <p className="text-[11px] text-gray-500">Reportes activos</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin className="size-4 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-[#172B2A]">{DEMO_RESOURCES.length}</p>
                  <p className="text-[11px] text-gray-500">Recursos activos</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="size-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-[#172B2A]">{DEMO_USERS.length}</p>
                  <p className="text-[11px] text-gray-500">Vecinos registrados</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-lg bg-[#FFF7E0] flex items-center justify-center">
                      <Radio className="size-4 text-[#F2A900]" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-[#172B2A]">
                    {emergencyMode ? "SOS" : "Normal"}
                  </p>
                  <p className="text-[11px] text-gray-500">Estado de la zona</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="size-4 text-rose-600" />
                    Últimos Reportes
                  </h2>
                  <button
                    onClick={() => setActiveSection("reports")}
                    className="text-xs font-semibold text-[#087F72] hover:underline flex items-center gap-1"
                  >
                    Ver todos <ChevronRight className="size-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {DEMO_REPORTS.map((r) => (
                    <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`size-8 shrink-0 rounded-lg flex items-center justify-center ${r.iconClass}`}>
                          <r.icon className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{r.type}</p>
                          <p className="text-[11px] text-gray-500">{r.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] h-5 border ${severityColor(r.severity)}`}>
                          {r.severity}
                        </Badge>
                        <span className="text-[11px] text-gray-400">{r.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <PhoneCall className="size-4 text-[#087F72]" />
                  <span className="text-sm font-semibold">Números de emergencia</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold">PNP: 105</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold">Bomberos: 116</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold">SAMU: 106</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold">Serenazgo AQP: (054) 205050</span>
                </div>
              </div>
            </>
          )}

          {activeSection === "posts" && <PendingPostsPanel />}

          {activeSection === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Reportes de Emergencia</h2>
                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                  Datos de demostración
                </Badge>
              </div>
              {DEMO_REPORTS.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${r.iconClass}`}>
                        <r.icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-base font-bold">{r.type}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="size-3" /> {r.location}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] h-5 border ${severityColor(r.severity)}`}>
                      Severidad: {r.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {r.time}
                    </span>
                    <span>Reportado por: {r.reporter}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] h-5 ${statusColor(r.status)}`}>
                      {r.status}
                    </Badge>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                      <Eye className="size-3 mr-1" /> Revisar
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                      <CheckCircle2 className="size-3 mr-1" /> Verificar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "resources" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Recursos Críticos y Puntos de Apoyo</h2>
                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                  Datos de demostración
                </Badge>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-48 sm:h-64 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="size-10 text-[#087F72] mx-auto opacity-40" />
                    <p className="text-sm text-gray-400 font-medium">Mapa interactivo de recursos</p>
                    <p className="text-[11px] text-gray-400">(Próximamente)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEMO_RESOURCES.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-start gap-3"
                  >
                    <span className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${res.iconClass}`}>
                      <res.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{res.name}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3" /> {res.location}
                      </p>
                    </div>
                    <Badge className={`text-[10px] h-5 ${statusColor(res.status)}`}>
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Gestión de Usuarios</h2>
                <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                  Datos de demostración
                </Badge>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs">Nombre</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs">Rol</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Perfil</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Barrio</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs">Estado</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {DEMO_USERS.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{u.name}</td>
                          <td className="px-5 py-3.5 capitalize text-gray-600">{u.role}</td>
                          <td className="px-5 py-3.5 capitalize text-gray-600 hidden sm:table-cell">{u.profile}</td>
                          <td className="px-5 py-3.5 text-gray-600 hidden sm:table-cell">{u.neighborhood}</td>
                          <td className="px-5 py-3.5">
                            <Badge className={`text-[10px] h-5 ${statusColor(u.status)}`}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-[#087F72] hover:bg-[#EAF5F1]">
                              Ver perfil
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Configuración</h2>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Activar modo emergencia</p>
                    <p className="text-[11px] text-gray-500">
                      Al activar, todos los vecinos de {user.location?.neighborhood || "tu zona"} verán el tablero de emergencia.
                    </p>
                  </div>
                  <Button
                    variant={emergencyMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setEmergencyMode(!emergencyMode)}
                    className="h-9 rounded-xl text-xs font-bold"
                  >
                    {emergencyMode ? "Desactivar SOS" : "Activar SOS"}
                  </Button>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold">Radio de cobertura</p>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Área de vigilancia y moderación asignada.
                  </p>
                  <div className="flex gap-2">
                    {["500m", "1km", "2km", "5km"].map((r) => (
                      <button
                        key={r}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-[#EAF5F1] hover:text-[#087F72] hover:border-[#087F72]/30 transition-all"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold">Zona asignada</p>
                  <p className="text-[11px] text-gray-500">
                    {user.location?.neighborhood || "Sin asignar"} – {user.location?.address || "Sin dirección"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <footer className="pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              AYNI · Conectamos vecinos, compartimos soluciones · Panel de Moderador
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
