"use client"

import { useSyncExternalStore } from "react"
import { apiFetch, ApiError } from "@/lib/api"
import {
  dequeue,
  EMPTY_OUTBOX,
  outboxSnapshot,
  setOutboxFailure,
  subscribeOutbox,
  type OutboxState,
} from "@/lib/outbox-store"

const RETRYABLE = new Set([0, 401, 408, 429, 500, 502, 503, 504])

let flushing: Promise<number> | null = null

export function flushOutbox(): Promise<number> {
  if (flushing) return flushing
  flushing = (async () => {
    let sent = 0
    for (const item of outboxSnapshot().items) {
      try {
        await apiFetch(item.path, { method: item.method, body: item.body })
        dequeue(item.id)
        sent++
      } catch (err) {
        if (err instanceof ApiError && RETRYABLE.has(err.status)) break
        dequeue(item.id)
        setOutboxFailure({
          label: item.label,
          message: err instanceof ApiError ? err.friendlyMessage : "Algo salió mal al enviarlo.",
        })
      }
    }
    return sent
  })().finally(() => {
    flushing = null
  })
  return flushing
}

export function useOutbox(): OutboxState {
  return useSyncExternalStore(subscribeOutbox, outboxSnapshot, () => EMPTY_OUTBOX)
}
