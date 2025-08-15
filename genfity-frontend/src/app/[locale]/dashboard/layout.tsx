import AuthGuard from "@/components/Auth/AuthGuard"
import DashboardLayoutClient from "@/components/Dashboard/DashboardLayoutClient"
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
