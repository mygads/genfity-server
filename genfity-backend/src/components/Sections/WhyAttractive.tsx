"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Clock, Eye, LineChart, ThumbsUp } from "lucide-react"

const benefits = [
  {
    icon: Eye,
    title: "Kesan Pertama yang Kuat",
    description: "Pengunjung memutuskan dalam 50 milidetik apakah mereka akan tetap di website Anda atau pergi.",
  },
  {
    icon: Clock,
    title: "Waktu Kunjungan Lebih Lama",
    description: "Website menarik membuat pengunjung betah dan mengeksplorasi lebih banyak halaman.",
  },
  {
    icon: ThumbsUp,
    title: "Meningkatkan Kepercayaan",
    description: "Desain profesional meningkatkan kredibilitas dan kepercayaan terhadap bisnis Anda.",
  },
  {
    icon: LineChart,
    title: "Konversi Lebih Tinggi",
    description: "Website menarik dengan UX yang baik menghasilkan tingkat konversi hingga 200% lebih tinggi.",
  },
]

export default function WhyAttractive() {
  return (
    <section className="bg-gray-50 py-10 md:py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 md:gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative order-2 md:order-1"
          >
            <div className="relative w-full h-56 sm:h-72 md:h-[400px] lg:h-[500px] overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Attractive Website Design"
                width={600}
                height={500}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />

              {/* Overlay with checkmark */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-500">✓</div>
                  <p className="mt-2 sm:mt-4 text-lg sm:text-xl font-semibold text-white">Buat Kesan yang Tak Terlupakan</p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-3 -right-3 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary"></div>
            <div className="absolute -left-3 -top-3 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/30"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <h2 className="mb-3 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Mengapa Website Harus <span className="text-primary">Menarik</span>
            </h2>
            <p className="mb-6 sm:mb-8 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Dalam dunia digital yang kompetitif, desain website yang menarik bukan sekadar estetika, tetapi kebutuhan
              bisnis.
            </p>

            <div className="space-y-4 sm:space-y-6">
              {benefits.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex"
                >
                  <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="mb-0.5 sm:mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
