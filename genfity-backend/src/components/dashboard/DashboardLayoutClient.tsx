"use client"

import SessionExpiryWarning from "@/components/Auth/SessionExpiryWarning"
import { useSessionMonitor } from "@/hooks/useSessionMonitor"
import type React from "react"
import { DashboardNavbar } from "./DashboardNavbar"
import { SidebarInset, SidebarProvider } from "../ui/sidebar"
import { AppSidebar } from "./DashboardSidebar"

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  // Enable session monitoring with auto-refresh and cross-tab sync
  const { refreshSession } = useSessionMonitor({
    enableAutoRefresh: true,
    enableCrossTabSync: true,
    onSessionRefreshed: () => {
      console.log('Session automatically refreshed')
    }
  })

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardNavbar />
          <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">{children}</main>
          <SessionExpiryWarning onExtendSession={refreshSession} />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
