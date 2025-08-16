import AuthGuard from "@/components/Auth/AuthGuard"
import { AdminAuthProvider } from "@/components/Auth/AdminAuthContext"
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient"
import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard redirectTo="/signin">
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AuthGuard>
  )
}
