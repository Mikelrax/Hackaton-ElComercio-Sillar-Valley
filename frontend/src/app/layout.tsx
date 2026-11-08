import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AYNI · Red Comunitaria y Soporte Vecinal",
  description:
    "Plataforma cívica barrial de servicios recomendados, apoyo solidario y coordinación en emergencias para Arequipa.",
  appleWebApp: {
    capable: true,
    title: "AYNI",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#087F72",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-900">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
