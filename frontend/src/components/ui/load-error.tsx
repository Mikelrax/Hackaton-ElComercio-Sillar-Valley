import * as React from "react"
import { RefreshCw, WifiOff } from "lucide-react"

export function LoadError({
  title = "No pudimos cargar Ayni",
  message = "Revisa tu conexión a internet y vuelve a intentarlo.",
  onRetry,
  className = "",
}: {
  title?: string
  message?: string
  onRetry: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`py-10 px-6 text-center bg-white rounded-2xl border border-gray-200/70 space-y-3 ${className}`}
    >
      <WifiOff className="size-9 text-gray-300 mx-auto" />
      <p className="text-[15px] font-bold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto h-11 px-5 rounded-xl border-2 border-[#087F72] text-[#087F72] font-bold text-sm flex items-center gap-2 hover:bg-[#EAF5F1]"
      >
        <RefreshCw className="size-4" />
        Reintentar
      </button>
    </div>
  )
}
