import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "./contexts/TenantContext";
import { AdminProvider } from "./contexts/AdminContext";
import Navigation from "./components/Navigation";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRMTA2 - Sistema de Costos 3D Multi-Tenant",
  description: "Sistema completo de gestión de costos de impresiones 3D con arquitectura multi-tenant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased bg-neutral-950 text-white min-h-screen`}>
        <AdminProvider>
          <TenantProvider>
            <Navigation />
            {children}
          </TenantProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
