"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { CheckCircle, Code, Fingerprint, Palette } from "lucide-react"

const features = [
  {
    icon: Fingerprint,
    title: "Identitas Brand Unik",
    description: "Kami membangun website yang mencerminkan identitas unik brand Anda, bukan template generik.",
  },
  {
    icon: Code,
    title: "Dikembangkan In-House",
    description: "Semua website kami dikembangkan in-house tanpa outsourcing atau developer luar negeri.",
  },
  {
    icon: Palette,
    title: "Desain Custom",
    description: "Setiap elemen desain dibuat khusus untuk bisnis Anda, bukan sekadar template yang dimodifikasi.",
  },
]

export default function CustomBuilt() {
  return (
    <section className="bg-white py-12 md:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Kami Membangun Website <span className="text-primary">Tanpa Template</span>
            </h2>
            <p className="mb-8 md:mb-12 text-gray-600 dark:text-gray-300 text-base md:text-lg">
              Setiap bisnis unik, dan website Anda juga harus demikian. Kami membangun setiap website dari awal, sesuai
              dengan kebutuhan spesifik Anda.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-10 md:gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex"
                >
                  <div className="mr-4 flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="mb-1 md:mb-2 text-lg md:text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 md:mt-10 rounded-lg bg-gray-50 p-4 md:p-6 dark:bg-gray-800">
              <h3 className="mb-2 md:mb-4 text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                Apakah Anda Memiliki Website yang Perlu Diperbaiki?
              </h3>
              <p className="mb-3 md:mb-4 text-gray-600 dark:text-gray-300 text-sm md:text-base">
                Entah Anda meluncurkan sesuatu yang baru atau memperbaiki apa yang telah rusak oleh orang lain — kami
                siap membantu.
              </p>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300 text-sm md:text-base">Konsultasi gratis untuk evaluasi website Anda</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative h-56 xs:h-72 sm:h-80 md:h-[500px] w-full overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Custom Website Development"
                width={600}
                height={500}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />

              {/* Overlay with code elements */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary/80 to-primary-dark/80">
                <div className="text-center text-white px-2">
                  <h3 className="mb-2 md:mb-4 text-lg md:text-2xl font-bold">100% Custom Code</h3>
                  <div className="mx-auto mb-2 md:mb-4 h-1 w-12 md:w-20 bg-white"></div>
                  <p className="mb-3 md:mb-6 text-xs md:text-base">Dibuat khusus untuk kebutuhan bisnis Anda</p>
                  <div className="inline-block rounded-lg bg-white/20 p-2 md:p-4">
                    <code className="text-xs md:text-sm font-mono">
                      &lt;div class=&quot;your-brand&quot;&gt;
                      <br />
                      &nbsp;&nbsp;// Kode unik untuk bisnis Anda
                      <br />
                      &lt;/div&gt;
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-3 -left-3 h-6 w-6 md:h-12 md:w-12 rounded-lg bg-primary"></div>
            <div className="absolute -right-3 -top-3 h-6 w-6 md:h-12 md:w-12 rounded-lg bg-primary/30"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
