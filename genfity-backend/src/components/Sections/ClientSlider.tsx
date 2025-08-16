"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const clients = [
  { id: 1, name: "Client 1", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 2, name: "Client 2", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 3, name: "Client 3", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 4, name: "Client 4", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 5, name: "Client 5", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 6, name: "Client 6", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 7, name: "Client 7", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
  { id: 8, name: "Client 8", logo: "https://img.freepik.com/premium-photo/young-girl-wearing-yellow-tshirt-smiling-facing-camera-empty-space-isolated-bright-yellow_74379-2763.jpg?semt=ais_hybrid&w=740" },
]

export default function ClientSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 4
  const totalPages = Math.ceil(clients.length / itemsPerPage)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages)
    }, 3000)

    return () => clearInterval(interval)
  }, [totalPages])

  const visibleClients = []
  for (let i = 0; i < itemsPerPage; i++) {
    const index = (currentIndex * itemsPerPage + i) % clients.length
    visibleClients.push(clients[index])
  }

  return (
    <section className="bg-gray-50 py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Ingin Punya Website? <span className="text-primary">Hubungi Kami</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Bergabunglah dengan ratusan bisnis yang telah mempercayakan pembuatan website mereka kepada kami
            </p>
          </motion.div>
        </div>

        <div className="relative overflow-hidden">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap justify-center gap-8"
            >
              {visibleClients.map((client) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex h-24 w-40 items-center justify-center rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900"
                >
                  <Image
                    src={client.logo || "/placeholder.svg"}
                    alt={client.name}
                    width={160}
                    height={80}
                    className="max-h-16 w-auto grayscale transition-all hover:grayscale-0"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="#contact"
              className="group inline-flex items-center rounded-lg bg-primary px-6 py-3 text-white transition-all hover:bg-primary-dark"
            >
              <span className="font-medium">Konsultasi Gratis</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
