import { NextResponse, type NextRequest } from "next/server"
import { LANDING_URL, appUrl, isLandingHost } from "@/lib/hosts"

const LANDING_PATH = "/landing"
const APP_ONLY = ["/login", "/registro", "/direcciones"]
const PWA_FILES = ["/sw.js", "/manifest.webmanifest"]

function under(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")

  if (!isLandingHost(host)) {
    if (under(pathname, LANDING_PATH)) return NextResponse.redirect(`${LANDING_URL}/`)
    return NextResponse.next()
  }

  if (PWA_FILES.includes(pathname)) return new NextResponse(null, { status: 404 })
  if (under(pathname, LANDING_PATH)) return NextResponse.redirect(`${LANDING_URL}/`)
  if (APP_ONLY.some(base => under(pathname, base))) return NextResponse.redirect(appUrl(`${pathname}${search}`))

  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = LANDING_PATH
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)", "/sw.js", "/manifest.webmanifest"],
}
