import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PORRA MUNDIAL 2026 MALOG",
  description: "Dashboard publico de la PORRA MUNDIAL 2026 MALOG"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
