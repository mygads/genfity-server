import type { Metadata } from "next";
import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GENFITY - Merged Platform",
  description: "GENFITY Digital Solutions - User and Admin Platform",
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
