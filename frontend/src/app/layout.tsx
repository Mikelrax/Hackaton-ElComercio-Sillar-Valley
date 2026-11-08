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
  title: "Ayni · Red comunitaria y apoyo vecinal",
  description:
    "Plataforma cívica barrial de servicios recomendados, apoyo solidario y coordinación en emergencias para Arequipa.",
  appleWebApp: {
    capable: true,
    title: "Ayni",
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
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-[#087F72]/20 selection:text-[#172B2A]">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
