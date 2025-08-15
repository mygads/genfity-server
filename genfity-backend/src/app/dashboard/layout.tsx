"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Navbar from "@/components/dashboard/Navbar" // Corrected import path
import Sidebar from "@/components/dashboard/Sidebar" // Corrected import path

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Or a loading spinner
  }
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuButtonClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
