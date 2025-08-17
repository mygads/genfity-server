"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ArrowRight, BarChart, Globe, Rocket, Users } from "lucide-react"

const benefits = [
  {
    icon: Globe,
    title: "Jangkauan Global",
    description: "Jangkau pelanggan potensial di seluruh dunia tanpa batasan geografis.",
  },
  {
    icon: BarChart,
    title: "Analitik Terperinci",
    description: "Dapatkan wawasan tentang perilaku pengunjung untuk pengambilan keputusan yang lebih baik.",
  },
  {
    icon: Users,
    title: "Pengalaman Pengguna Optimal",
    description: "Website yang dirancang dengan fokus pada pengalaman pengguna untuk meningkatkan konversi.",
  },
  {
    icon: Rocket,
    title: "Performa Tinggi",
    description: "Website cepat dan responsif yang memberikan pengalaman terbaik di semua perangkat.",
  },
]

export default function BusinessServices() {
  return (
    <section className="bg-white py-12 md:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 md:gap-12 grid-cols-1 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Layanan yang Kami Berikan untuk <span className="text-primary">Bisnis Anda</span>
            </h2>
            <p className="mb-6 md:mb-8 text-gray-600 dark:text-gray-300 text-base md:text-lg">
              Kami tidak hanya membangun website, tetapi juga memberikan solusi digital komprehensif untuk membantu
              bisnis Anda tumbuh.
            </p>

            <div className="mb-6 md:mb-8 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base md:text-lg font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            <a href="#contact" className="inline-flex items-center text-primary hover:underline text-base md:text-lg">
              <span>Pelajari lebih lanjut</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full h-64 sm:h-80 md:h-[500px] overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Business Services"
                width={600}
                height={500}
                className="h-full w-full object-cover"
                priority
              />

              {/* Overlay with statistics */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/80 to-primary-dark/80">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-8 text-white">
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold">93%</div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm">Peningkatan Traffic</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold">87%</div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm">Peningkatan Konversi</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold">24/7</div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm">Dukungan Teknis</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-bold">100%</div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm">Kepuasan Klien</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-primary"></div>
            <div className="absolute -left-4 sm:-left-6 -top-4 sm:-top-6 h-8 w-8 sm:h-12 sm:w-12 rounded-lg bg-primary/30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
