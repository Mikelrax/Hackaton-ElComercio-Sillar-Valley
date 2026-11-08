import { apiFetch } from "@/lib/api"
import { Address, AddressInput } from "@/lib/auth"

export const addressesApi = {
  list(): Promise<Address[]> {
    return apiFetch<Address[]>("/api/users/me/addresses")
  },

  add(input: AddressInput): Promise<Address> {
    return apiFetch<Address>("/api/users/me/addresses", { method: "POST", body: input })
  },

  makePrimary(id: number): Promise<Address> {
    return apiFetch<Address>(`/api/users/me/addresses/${id}/primary`, { method: "POST" })
  },

  async remove(id: number): Promise<void> {
    await apiFetch(`/api/users/me/addresses/${id}`, { method: "DELETE" })
  },
}
