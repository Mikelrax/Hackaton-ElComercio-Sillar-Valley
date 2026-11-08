export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

const SESSION_KEY = "ayni_session"

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get friendlyMessage(): string {
    const firstField = this.fieldErrors ? Object.values(this.fieldErrors)[0] : undefined
    return firstField || this.message
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw).token as string | undefined) ?? null : null
  } catch {
    return null
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  auth?: boolean
}

export async function apiFetch<T>(path: string, { method = "GET", body, auth = true }: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "No pudimos conectar con AYNI. Revisa tu internet e intenta de nuevo.")
  }

  if (response.status === 401 && auth && typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
    window.location.href = "/login"
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || "Algo salió mal. Intenta de nuevo en unos segundos.",
      data?.fieldErrors ?? undefined
    )
  }
  return data as T
}

export { SESSION_KEY }
