"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { AlertTriangle, Clock, Smartphone, Zap } from "lucide-react"

const limitations = [
  {
    icon: Zap,
    title: "Performa Lambat",
    description:
      "Website biasa sering memiliki waktu loading yang lambat, membuat pengunjung meninggalkan halaman Anda.",
  },
  {
    icon: Smartphone,
    title: "Tidak Responsif",
    description:
      "Banyak website biasa tidak dioptimalkan untuk perangkat mobile, padahal mayoritas pengguna mengakses dari smartphone.",
  },
  {
    icon: AlertTriangle,
    title: "Keamanan Minim",
    description:
      "Website biasa sering mengabaikan aspek keamanan, membuat data Anda dan pelanggan rentan terhadap serangan.",
  },
  {
    icon: Clock,
    title: "Sulit Diperbarui",
    description:
      "Memperbarui konten pada website biasa sering membutuhkan bantuan teknis, memperlambat respons bisnis Anda.",
  },
]

export default function WhyBasicNotEnough() {
  return (
    <section className="bg-white py-10 md:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 md:gap-12 grid-cols-1 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white md:mb-4 md:text-4xl">
              Mengapa Website <span className="text-primary">Biasa</span> Tidaklah Cukup
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300 md:mb-8">
              Di pasar yang kompetitif saat ini, memiliki website biasa saja tidak akan membuat bisnis Anda menonjol.
            </p>

            <div className="space-y-5 md:space-y-6">
              {limitations.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex"
                >
                  <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base md:text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full aspect-[6/5] md:h-[500px] md:aspect-auto overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Basic Website Limitations"
                width={600}
                height={500}
                className="h-full w-full object-cover"
                priority
              />

              {/* Overlay with "X" marks */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-bold text-white">✗</div>
                  <p className="mt-2 md:mt-4 text-base md:text-xl font-semibold text-white">Jangan Batasi Potensi Bisnis Anda</p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 -left-4 h-8 w-8 md:h-12 md:w-12 rounded-lg bg-primary"></div>
            <div className="absolute -right-4 -top-4 h-8 w-8 md:h-12 md:w-12 rounded-lg bg-primary/30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
