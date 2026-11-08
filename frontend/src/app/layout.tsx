import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AYNI · Red Comunitaria y Soporte Vecinal",
  description: "Plataforma cívica barrial de servicios recomendados, apoyo solidario y coordinación en emergencias para Arequipa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
