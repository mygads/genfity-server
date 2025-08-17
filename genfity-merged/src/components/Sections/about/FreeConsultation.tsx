"use client"

import { motion } from "framer-motion"
import { MessageCircle, Phone, Mail, Calendar, CheckCircle, Star } from 'lucide-react'
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"

const consultationFeatures = [
  {
    icon: MessageCircle,
    title: "Konsultasi Gratis",
    description: "Diskusi mendalam tentang kebutuhan bisnis Anda tanpa biaya",
  },
  {
    icon: Calendar,
    title: "Jadwal Fleksibel",
    description: "Atur waktu konsultasi sesuai dengan kesibukan Anda",
  },
  {
    icon: CheckCircle,
    title: "Solusi Custom",
    description: "Rekomendasi solusi yang disesuaikan dengan budget dan kebutuhan",
  },
  {
    icon: Star,
    title: "Tanpa Komitmen",
    description: "Tidak ada kewajiban untuk menggunakan layanan kami setelah konsultasi",
  },
]

export default function FreeConsultation() {
  return (
    <section className="bg-gradient-to-b from-primary/5 to-white py-12 sm:py-16 lg:py-20 dark:from-primary/10 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Belum Menemukan Layanan yang <span className="text-primary">Sesuai?</span>
            </h2>
            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Jangan khawatir! Kami menyediakan konsultasi gratis untuk membantu Anda menemukan solusi digital yang tepat
              untuk bisnis Anda.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >            <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Mengapa Memilih Konsultasi Gratis Kami?
            </h3>
            
            <div className="space-y-4 sm:space-y-6">
              {consultationFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex"
                >
                  <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1 sm:mb-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}            className="rounded-2xl bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:bg-gray-800"
          >
            <div className="mb-4 sm:mb-6 text-center">
              <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Konsultasi Gratis
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Diskusikan kebutuhan proyek Anda dengan expert kami
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3 sm:p-4 dark:bg-gray-700">
                <h4 className="mb-2 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Yang Akan Anda Dapatkan:</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Analisis kebutuhan bisnis mendalam
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Rekomendasi solusi terbaik
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Estimasi timeline dan budget
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Roadmap pengembangan
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <InteractiveHoverButton
                  className="w-full"
                  link="/contact"
                  text="Mulai Konsultasi Gratis"
                />
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <a
                    href="tel:+6281234567890"
                    className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <Phone className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Call
                  </a>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}          className="mt-12 sm:mt-16 text-center"
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:bg-gray-800">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Masih Ragu? Simak Testimoni Klien Kami
            </h3>
            <div className="mb-4 sm:mb-6 flex justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">(4.9/5 dari 150+ klien)</span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              &quot;Tim Genfity sangat profesional dalam memberikan konsultasi. Mereka membantu kami memahami kebutuhan
              digital bisnis dan memberikan solusi yang tepat sasaran.&quot;
            </p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
              - Ahmad Fauzi, CEO PT Maju Bersama
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
