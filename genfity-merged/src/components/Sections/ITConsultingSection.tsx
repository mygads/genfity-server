"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function ITConsultingSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Layanan <span className="text-primary">Konsultan IT</span> Profesional
            </h2>
            <p className="mb-8 md:mb-12 text-gray-600 dark:text-gray-300 text-base md:text-lg">
              Kami menyediakan layanan konsultasi IT untuk membantu bisnis Anda mengoptimalkan penggunaan teknologi
            </p>
          </motion.div>
        </div>

        <div className="grid gap-10 md:gap-12 md:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative w-full h-56 xs:h-72 sm:h-80 md:h-[400px] overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="IT Consulting Services"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            </div>
            <div className="hidden md:block absolute -bottom-6 -left-6 h-32 w-32 md:h-48 md:w-48 rounded-lg bg-primary/10"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-4 md:mb-6 text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Mengapa Membutuhkan Konsultan IT?
            </h3>
            <p className="mb-4 md:mb-6 text-gray-600 dark:text-gray-300 text-sm md:text-base">
              Di era digital yang berkembang pesat, bisnis memerlukan strategi teknologi yang tepat untuk tetap
              kompetitif. Konsultan IT kami membantu Anda mengidentifikasi solusi teknologi yang sesuai dengan kebutuhan
              bisnis Anda.
            </p>

            <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
              {[
                "Analisis kebutuhan teknologi bisnis Anda",
                "Rekomendasi solusi IT yang tepat dan efisien",
                "Implementasi sistem yang sesuai dengan kebutuhan",
                "Optimalisasi infrastruktur IT yang sudah ada",
                "Pelatihan dan dukungan teknis berkelanjutan",
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="mr-2 md:mr-3 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="/services"
              className="group inline-flex items-center rounded-lg bg-primary px-4 py-2 md:px-6 md:py-3 text-white transition-all hover:bg-primary-dark text-sm md:text-base"
            >
              <span className="font-medium">Pelajari Lebih Lanjut</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
