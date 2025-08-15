import { Metadata } from "next"
import DevicesTab from "@/components/WhatsApp/DevicesTab"

export const metadata: Metadata = {
  title: "Perangkat WhatsApp - Genfity",
  description: "Kelola perangkat WhatsApp session Anda",
}

export default function WhatsAppDevicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Perangkat WhatsApp
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola session WhatsApp, buat perangkat baru, dan pantau status koneksi
        </p>
      </div>
      
      <DevicesTab />
    </div>
  )
}
