function trimSlash(url: string) {
  return url.replace(/\/+$/, "")
}

export const APP_URL = trimSlash(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
export const LANDING_URL = trimSlash(process.env.NEXT_PUBLIC_LANDING_URL || "http://inicio.localhost:3000")

const LANDING_HOST = new URL(LANDING_URL).host.toLowerCase()

export function isLandingHost(host: string | null | undefined): boolean {
  return !!host && host.toLowerCase() === LANDING_HOST
}

export function appUrl(path = "/"): string {
  return `${APP_URL}${path}`
}
