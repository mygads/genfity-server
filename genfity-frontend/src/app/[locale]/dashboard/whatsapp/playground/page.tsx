import { Metadata } from "next"
import PlaygroundTab from "@/components/WhatsApp/PlaygroundTab"

export const metadata: Metadata = {
  title: "WhatsApp Playground - Genfity",
  description: "Uji coba WhatsApp API langsung dengan session yang aktif",
}

export default function WhatsAppPlaygroundPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          WhatsApp Playground
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Uji coba WhatsApp API langsung dengan session yang aktif
        </p>
      </div>
      
      <PlaygroundTab />
    </div>
  )
}
