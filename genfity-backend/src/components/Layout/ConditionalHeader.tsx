"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"

export default function ConditionalHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  if (segments[2] === "dashboard") {
    return null
  }
  return <Header />
}
