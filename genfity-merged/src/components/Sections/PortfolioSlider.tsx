"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react"

const portfolioItems = [
  {
    id: 1,
    title: "E-Commerce Fashion",
    category: "E-Commerce",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Website e-commerce modern dengan fitur keranjang belanja, pembayaran online, dan manajemen inventaris.",
  },
  {
    id: 2,
    title: "Portal Berita",
    category: "Media",
    image: "/placeholder.svg?height=400&width=600",
    description: "Portal berita responsif dengan sistem manajemen konten yang mudah digunakan dan fitur komentar.",
  },
  {
    id: 3,
    title: "Website Properti",
    category: "Real Estate",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Platform properti dengan pencarian lanjutan, filter, dan integrasi peta untuk memudahkan pencarian properti.",
  },
  {
    id: 4,
    title: "Aplikasi Restoran",
    category: "F&B",
    image: "/placeholder.svg?height=400&width=600",
    description:
      "Website restoran dengan sistem pemesanan online, menu digital, dan integrasi dengan layanan pengiriman.",
  },
]

export default function PortfolioSlider() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % portfolioItems.length)
  }

  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + portfolioItems.length) % portfolioItems.length)
  }

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
              Portofolio <span className="text-primary">Kami</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Lihat beberapa contoh website yang telah kami kembangkan untuk klien kami
            </p>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="relative h-[500px] overflow-hidden rounded-xl">
            {portfolioItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0,
                  x: activeIndex === index ? 0 : 100,
                  position: activeIndex === index ? "relative" : "absolute",
                }}
                transition={{ duration: 0.5 }}
                className="h-full w-full"
              >
                <div className="grid h-full grid-cols-1 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 md:grid-cols-2">
                  <div className="relative h-64 md:h-full">
                    <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    <div className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                      {item.category}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-8">
                    <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">{item.description}</p>
                    <a href="#" className="inline-flex w-fit items-center text-primary hover:underline">
                      <span>Lihat Detail</span>
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={prevSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary"
              aria-label="Previous slide"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {portfolioItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-3 w-3 rounded-full transition-all ${
                    activeIndex === index ? "bg-primary w-6" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-primary hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary"
              aria-label="Next slide"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
