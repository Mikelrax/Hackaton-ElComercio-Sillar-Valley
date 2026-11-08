import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SoftBackdrop } from "@/components/layout/SoftBackdrop"

export interface LegalSection {
  title: string
  items: string[]
}

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <SoftBackdrop className="flex justify-center font-sans text-[#1C1917]">
      <main className="w-full max-w-[640px] px-5 pt-6 pb-16 space-y-7">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 pr-3 text-[15px] font-semibold text-[#57534E] hover:text-[#1C1917]"
        >
          <span className="size-11 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center">
            <ArrowLeft className="size-5" />
          </span>
          Volver al inicio
        </Link>

        <header className="space-y-2">
          <h1 className="text-[30px] font-bold tracking-tight leading-tight">{title}</h1>
          <p className="text-[17px] leading-relaxed text-[#44403C]">{intro}</p>
        </header>

        {sections.map(section => (
          <section key={section.title} className="rounded-2xl bg-white border border-[#E7E5E4] p-5 space-y-3">
            <h2 className="text-[19px] font-bold">{section.title}</h2>
            <ul className="space-y-2.5 list-disc pl-5 marker:text-[#087F72]">
              {section.items.map(item => (
                <li key={item} className="text-[16px] leading-relaxed text-[#44403C]">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </SoftBackdrop>
  )
}
