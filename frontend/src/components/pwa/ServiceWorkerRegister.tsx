"use client"

import { useEffect } from "react"
import { isLandingHost } from "@/lib/hosts"

function loadedAssets(): string[] {
  const urls = performance
    .getEntriesByType("resource")
    .map(entry => entry.name)
    .filter(url => url.startsWith(window.location.origin) && url.includes("/_next/static/"))
  return Array.from(new Set(urls))
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    if (isLandingHost(window.location.host)) return
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then(registration => {
        registration.active?.postMessage({ type: "cache-urls", urls: loadedAssets() })
      })
      .catch(() => {})
  }, [])

  return null
}
