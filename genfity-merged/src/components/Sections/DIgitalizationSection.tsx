"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { TrendingUp, Shield, Zap, BarChart } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: "Meningkatkan Efisiensi",
    description: "Otomatisasi proses bisnis untuk meningkatkan efisiensi operasional dan mengurangi biaya.",
  },
  {
    icon: Shield,
    title: "Keamanan Data",
    description: "Sistem keamanan data yang kuat untuk melindungi informasi penting bisnis Anda.",
  },
  {
    icon: Zap,
    title: "Respons Cepat",
    description: "Akses data real-time untuk pengambilan keputusan yang lebih cepat dan tepat.",
  },
  {
    icon: BarChart,
    title: "Analisis Mendalam",
    description: "Analisis data komprehensif untuk memahami tren bisnis dan peluang pertumbuhan.",
  },
]

export default function DigitalizationSection() {
  return (
    <section className="bg-white py-12 md:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col-reverse gap-12 md:grid md:grid-cols-2 md:items-center">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative w-full"
          >
            <div className="relative h-56 xs:h-72 sm:h-96 md:h-[400px] lg:h-[500px] w-full overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Business Digitalization"
                width={600}
                height={500}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 xs:h-32 xs:w-32 md:h-48 md:w-48 rounded-lg bg-primary/10"></div>
            <div className="absolute -top-4 -left-4 h-24 w-24 xs:h-32 xs:w-32 md:h-48 md:w-48 rounded-lg bg-primary/10"></div>
          </motion.div>

          {/* Right Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-xl w-full"
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
              Transformasi <span className="text-primary">Digital</span> untuk Bisnis Anda
            </h2>

            <p className="mb-6 text-base text-gray-600 dark:text-gray-300 sm:text-lg">
              Digitalisasi bisnis bukan lagi pilihan, tetapi keharusan di era modern. Kami membantu bisnis Anda
              bertransformasi dengan solusi digital yang komprehensif dan disesuaikan dengan kebutuhan spesifik Anda.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">{benefit.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8">
              <a
                href="#contact"
                className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 sm:px-6 sm:py-3 font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Konsultasi Gratis
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
