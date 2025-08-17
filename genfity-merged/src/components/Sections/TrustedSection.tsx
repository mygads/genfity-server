"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const testimonials = [
  {
    quote: "Website baru kami telah meningkatkan penjualan online sebesar 40% dalam 3 bulan pertama.",
    author: "Ahmad Fauzi",
    company: "Fauzi Furniture",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    quote: "Tim sangat profesional dan responsif. Mereka memahami kebutuhan bisnis kami dengan baik.",
    author: "Siti Rahayu",
    company: "Rahayu Catering",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    quote: "Desain website yang dibuat sangat menarik dan sesuai dengan identitas brand kami.",
    author: "Budi Santoso",
    company: "Santoso Property",
    image: "/placeholder.svg?height=80&width=80",
  },
]

export default function TrustedSection() {
  return (
    <section className="bg-white py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Dipercaya oleh <span className="text-primary">Bisnis Lokal</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Lihat apa yang dikatakan klien kami tentang layanan kami
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl bg-gray-50 p-6 shadow-sm dark:bg-gray-800"
            >
              <div className="mb-4 text-primary">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{testimonial.quote}</p>
              <div className="flex items-center">
                <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{testimonial.author}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 rounded-xl bg-primary p-8 text-white">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-2xl font-bold">Siap untuk Meningkatkan Kehadiran Online Anda?</h3>
              <p className="mb-6">
                Bergabunglah dengan ratusan bisnis yang telah mempercayakan pembuatan website mereka kepada kami.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-primary transition-colors hover:bg-gray-100"
              >
                Konsultasi Gratis
              </a>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">150+</div>
                <p className="mt-2">Proyek Selesai</p>
                <div className="mt-4 text-4xl font-bold">98%</div>
                <p className="mt-2">Klien Puas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
