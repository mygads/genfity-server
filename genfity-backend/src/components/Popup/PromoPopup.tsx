"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      // Check if user has dismissed the popup before
      const popupDismissed = localStorage.getItem("promoPopupDismissed")
      if (!popupDismissed) {
        setIsOpen(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Set a flag in localStorage to not show the popup again for some time
    localStorage.setItem("promoPopupDismissed", "true")
    // Clear the flag after 7 days
    setTimeout(
      () => {
        localStorage.removeItem("promoPopupDismissed")
      },
      7 * 24 * 60 * 60 * 1000,
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-md rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h3 className="mb-2 text-xl font-bold text-primary">Promo Spesial!</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Dapatkan diskon 20% untuk pembuatan website baru hingga akhir bulan ini!
          </p>

          <div className="mb-4 rounded-md bg-primary/10 p-4 text-center">
            <span className="text-lg font-bold text-primary">PROMO20</span>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Gunakan kode promo saat konsultasi</p>
          </div>

          <button
            onClick={handleClose}
            className="w-full rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
          >
            Dapatkan Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
