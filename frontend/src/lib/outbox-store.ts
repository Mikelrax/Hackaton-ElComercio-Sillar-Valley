export interface OutboxItem {
  id: string
  path: string
  method: "POST" | "PUT" | "PATCH" | "DELETE"
  body: unknown
  label: string
  createdAt: number
}

export interface OutboxState {
  items: OutboxItem[]
  failed: { label: string; message: string } | null
}

const STORAGE_KEY = "ayni_outbox"

export const EMPTY_OUTBOX: OutboxState = { items: [], failed: null }

let state: OutboxState | null = null
const listeners = new Set<() => void>()

function read(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as OutboxItem[]) : []
  } catch {
    return []
  }
}

function update(next: OutboxState) {
  state = next
  try {
    if (next.items.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(next.items))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
  listeners.forEach(listener => listener())
}

export function outboxSnapshot(): OutboxState {
  if (!state) state = { items: read(), failed: null }
  return state
}

export function subscribeOutbox(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    state = { items: read(), failed: outboxSnapshot().failed }
    listeners.forEach(l => l())
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

export function enqueue(item: Omit<OutboxItem, "id" | "createdAt">) {
  const current = outboxSnapshot()
  const entry: OutboxItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  update({ ...current, items: [...current.items, entry] })
}

export function dequeue(id: string) {
  const current = outboxSnapshot()
  update({ ...current, items: current.items.filter(item => item.id !== id) })
}

export function setOutboxFailure(failed: OutboxState["failed"]) {
  update({ ...outboxSnapshot(), failed })
}

export function clearOutbox() {
  update(EMPTY_OUTBOX)
}
