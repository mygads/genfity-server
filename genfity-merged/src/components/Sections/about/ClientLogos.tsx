"use client"

import { motion } from "framer-motion"
import Image from "next/image"

// Sample client logos - replace with actual client logos
const clientLogos = [
  { name: "Client 1", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 2", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 3", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 4", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 5", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 6", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 7", logo: "/placeholder.svg?height=80&width=160" },
  { name: "Client 8", logo: "/placeholder.svg?height=80&width=160" },
]

export default function ClientLogos() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Klien <span className="text-primary">Kami</span>
            </h2>
            <p className="mb-8 sm:mb-10 lg:mb-12 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Kami bangga telah bekerja sama dengan berbagai perusahaan terkemuka
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {clientLogos.map((client, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >              <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-gray-900">
                <Image
                  src={client.logo || "/placeholder.svg"}
                  alt={client.name}
                  width={160}
                  height={80}
                  className="h-8 sm:h-10 lg:h-12 w-auto object-contain grayscale transition-all hover:grayscale-0"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
