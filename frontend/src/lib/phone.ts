export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9)
}

export function formatPhone(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join(" ")
}
