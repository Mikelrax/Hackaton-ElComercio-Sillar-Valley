"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface BigSelectOption {
  value: string
  label: string
  icon?: LucideIcon
}

interface BigSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: BigSelectOption[]
  icon?: LucideIcon
  placeholder?: string
  ariaLabel?: string
}

export function BigSelect({ id, value, onValueChange, options, icon, placeholder, ariaLabel }: BigSelectProps) {
  const selected = options.find(o => o.value === value)
  const TriggerIcon = selected?.icon ?? icon
  const items = Object.fromEntries(options.map(o => [o.value, o.label]))

  return (
    <Select
      value={value}
      items={items}
      onValueChange={next => {
        if (typeof next === "string") onValueChange(next)
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className="w-full data-[size=default]:h-14 rounded-2xl border-2 border-[#E7E5E4] bg-white pl-4 pr-4 gap-3 text-[17px] font-semibold text-[#1C1917] shadow-none transition-colors hover:border-[#A8A29E] focus-visible:border-[#087F72] focus-visible:ring-4 focus-visible:ring-[#087F72]/15 data-popup-open:border-[#087F72] [&>svg:last-child]:size-5 [&>svg:last-child]:text-[#57534E] [&>svg:last-child]:transition-transform data-popup-open:[&>svg:last-child]:rotate-180"
      >
        {TriggerIcon && <TriggerIcon className="size-5 text-[#087F72]" aria-hidden="true" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        sideOffset={8}
        className="max-h-[min(22rem,var(--available-height))] rounded-2xl border border-[#E7E5E4] bg-white p-1.5 shadow-xl ring-0"
      >
        {options.map(option => {
          const Icon = option.icon
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-12 cursor-pointer gap-3 rounded-xl py-2.5 pl-3 pr-10 text-[16px] font-medium text-[#1C1917] focus:bg-[#EAF5F1] focus:text-[#087F72] data-[selected]:font-bold data-[selected]:text-[#087F72] [&_svg]:size-5"
            >
              {Icon && <Icon className="text-[#087F72]" aria-hidden="true" />}
              {option.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
