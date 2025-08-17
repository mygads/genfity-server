import type { Metadata } from "next";
import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GENFITY - Digital Solutions",
  description: "GENFITY Digital Solutions adalah software house dan digital agency yang menyediakan layanan pengembangan aplikasi, integrasi WhatsApp API, serta solusi customer service AI berbasis WhatsApp untuk bisnis Anda.",
  icons: {
    icon: "/web-icon.svg",
    shortcut: "/web-icon.svg",
    apple: "/web-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
