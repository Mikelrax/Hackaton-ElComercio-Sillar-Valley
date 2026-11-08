import * as React from "react"
import { AlertCircle } from "lucide-react"
import { errorClass } from "@/lib/form-styles"

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className={errorClass} role="alert">
      <AlertCircle className="size-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
