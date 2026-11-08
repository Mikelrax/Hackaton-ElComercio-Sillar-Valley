import { apiFetch } from "@/lib/api"
import { KusiReply, KusiRole } from "@/lib/types"

export interface KusiTurn {
  role: KusiRole
  text: string
}

export const kusiApi = {
  chat(messages: KusiTurn[], location: { lat: number; lng: number }): Promise<KusiReply> {
    return apiFetch<KusiReply>("/api/assistant/chat", {
      method: "POST",
      body: { messages, latitude: location.lat, longitude: location.lng },
    })
  },
}
