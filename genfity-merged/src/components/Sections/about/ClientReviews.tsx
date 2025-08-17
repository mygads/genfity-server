"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

// Sample reviews - replace with actual client reviews
const reviews = [
  {
    id: 1,
    name: "Ahmad Fauzi",
    position: "CEO, PT Maju Bersama",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    review:
      "Kami sangat puas dengan website yang dibuat. Desainnya menarik, responsif, dan sesuai dengan kebutuhan bisnis kami. Tim mereka sangat profesional dan komunikatif selama proses pengembangan.",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    position: "Marketing Director, CV Sukses Mandiri",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    review:
      "Layanan konsultasi IT mereka sangat membantu bisnis kami. Mereka memberikan solusi yang tepat untuk masalah yang kami hadapi dan membantu kami mengoptimalkan sistem IT kami.",
  },
  {
    id: 3,
    name: "Budi Santoso",
    position: "Owner, Toko Online Berkah",
    image: "/placeholder.svg?height=100&width=100",
    rating: 4,
    review:
      "Website e-commerce yang mereka buat sangat membantu meningkatkan penjualan online kami. Fitur-fiturnya lengkap dan mudah digunakan. Sangat merekomendasikan jasa mereka!",
  },
]

export default function ClientReviews() {
  const [currentReview, setCurrentReview] = useState(0)

  const nextReview = () => {
    setCurrentReview((prev) => (prev === reviews.length - 1 ? 0 : prev + 1))
  }

  const prevReview = () => {
    setCurrentReview((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))
  }
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
              Apa Kata <span className="text-primary">Klien</span> Kami
            </h2>
            <p className="mb-8 sm:mb-10 lg:mb-12 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Dengarkan pengalaman klien yang telah bekerja sama dengan kami
            </p>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <motion.div
            key={currentReview}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}            className="rounded-xl bg-gray-50 p-4 sm:p-6 lg:p-8 shadow-sm dark:bg-gray-800"
          >
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center">
              <div className="mb-3 sm:mb-0 sm:mr-4 h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-full mx-auto sm:mx-0">
                <Image
                  src={reviews[currentReview].image || "/placeholder.svg"}
                  alt={reviews[currentReview].name}
                  width={100}
                  height={100}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{reviews[currentReview].name}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{reviews[currentReview].position}</p>
                <div className="mt-1 flex justify-center sm:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 sm:h-4 sm:w-4 ${
                        i < reviews[currentReview].rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-base sm:text-lg italic text-gray-600 dark:text-gray-300 text-center sm:text-left">&quot;{reviews[currentReview].review}&quot;</p>
          </motion.div>          <div className="mt-6 sm:mt-8 flex justify-center space-x-4">
            <button
              onClick={prevReview}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`h-2 w-6 sm:w-8 rounded-full transition-colors ${
                    currentReview === index ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextReview}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300"
              aria-label="Next review"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
