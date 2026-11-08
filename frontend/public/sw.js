const VERSION = "ayni-v1"
const PAGES = `${VERSION}-pages`
const ASSETS = `${VERSION}-assets`
const MAP = `${VERSION}-map`
const API = `${VERSION}-api`
const SHELL = ["/", "/login", "/registro", "/direcciones"]
const MAX_MAP_ENTRIES = 600

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => !key.startsWith(VERSION)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("message", event => {
  if (event.data?.type !== "cache-urls" || !Array.isArray(event.data.urls)) return
  event.waitUntil(
    caches.open(ASSETS).then(cache =>
      Promise.all(
        event.data.urls.map(url =>
          cache
            .match(url)
            .then(hit => hit || cache.add(url))
            .catch(() => undefined)
        )
      )
    )
  )
})

async function trim(cache, limit) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i])
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = (await cache.match(request, { ignoreVary: true })) || (fallbackUrl && (await cache.match(fallbackUrl)))
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request, { ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    if (limit) trim(cache, limit)
  }
  return response
}

self.addEventListener("fetch", event => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.protocol !== "http:" && url.protocol !== "https:") return

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES, "/"))
    return
  }

  if (url.origin === self.location.origin) {
    if (url.pathname === "/sw.js") return
    if (url.pathname.startsWith("/_next/static/") || /\.(?:svg|png|jpe?g|webp|ico|woff2?)$/.test(url.pathname)) {
      event.respondWith(cacheFirst(request, ASSETS))
      return
    }
    if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") {
      event.respondWith(networkFirst(request, PAGES))
    }
    return
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API))
    return
  }

  if (/\/styles\//.test(url.pathname)) {
    event.respondWith(networkFirst(request, MAP))
    return
  }

  if (/\.(?:pbf|mvt|png|webp|json)$|\/fonts\/|\/sprites?\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request, MAP, MAX_MAP_ENTRIES))
  }
})
