"use client"

import { motion } from "framer-motion"
import { MapPin, Clock, Phone, Mail } from 'lucide-react'

export default function LocationMap() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Lokasi <span className="text-primary">Kami</span>
            </h2>
            <p className="mb-8 sm:mb-10 lg:mb-12 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Kunjungi kantor kami atau hubungi kami untuk informasi lebih lanjut
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}            className="h-[300px] sm:h-[350px] lg:h-[400px] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            {/* Replace with actual map embed */}
            <div className="flex h-full items-center justify-center">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center px-4">Google Maps Embed akan ditampilkan di sini</p>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Informasi Kontak</h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex">
                <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Alamat</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Jl. Contoh No. 123, Jakarta Selatan, Indonesia</p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Jam Operasional</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Senin - Jumat: 09:00 - 17:00</p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Sabtu: 09:00 - 15:00</p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Minggu: Tutup</p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Telepon</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">+62 123 4567 890</p>
                </div>
              </div>

              <div className="flex">
                <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Email</h4>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">info@contohwebsite.com</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
