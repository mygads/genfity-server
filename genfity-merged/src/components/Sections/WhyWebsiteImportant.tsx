"use client"

import { motion } from "framer-motion"
import { Globe, Search, ShoppingCart, Users } from "lucide-react"

const reasons = [
  {
    icon: Globe,
    title: "Kehadiran Online 24/7",
    description:
      "Website Anda bekerja sepanjang waktu, memberikan informasi dan layanan bahkan ketika Anda sedang istirahat.",
  },
  {
    icon: Search,
    title: "Meningkatkan Kredibilitas",
    description:
      "Website profesional meningkatkan kepercayaan pelanggan dan membuat bisnis Anda terlihat lebih terpercaya.",
  },
  {
    icon: ShoppingCart,
    title: "Memperluas Jangkauan Pasar",
    description: "Jangkau pelanggan potensial di seluruh dunia tanpa batasan geografis.",
  },
  {
    icon: Users,
    title: "Membangun Hubungan dengan Pelanggan",
    description: "Berinteraksi dengan pelanggan melalui konten, formulir kontak, dan media sosial terintegrasi.",
  },
]

export default function WhyWebsiteImportant() {
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
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Mengapa Website <span className="text-primary">Penting</span> untuk Bisnis Anda
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Di era digital saat ini, website bukan lagi sekadar pilihan, tetapi kebutuhan untuk setiap bisnis
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {reasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <reason.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{reason.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
