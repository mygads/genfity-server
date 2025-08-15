"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FaDesktop, FaPenNib, FaChartLine, FaHeadphones } from "react-icons/fa"

type ServiceCategory = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  image: string
  features: string[]
  link: string
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "website",
    name: "Website Development",
    description:
      "Kami membangun website yang tidak hanya menarik secara visual, tetapi juga fungsional dan dioptimalkan untuk konversi. Dari landing page sederhana hingga sistem e-commerce yang kompleks, kami menyediakan solusi website yang sesuai dengan kebutuhan bisnis Anda.",
    icon: <FaDesktop className="h-8 w-8" />,
    image: "/placeholder.svg?height=400&width=600",
    features: [
      "Desain responsif untuk semua perangkat",
      "Pengalaman pengguna yang optimal",
      "Kode bersih dan teroptimasi",
      "SEO-friendly untuk peringkat yang lebih baik",
      "Integrasi dengan sistem bisnis Anda",
    ],
    link: "/products?category=website",
  },
  {
    id: "design",
    name: "Design Services",
    description:
      "Tim desainer profesional kami menciptakan identitas visual yang menarik dan konsisten untuk brand Anda. Dari logo hingga materi pemasaran, kami memastikan setiap elemen desain mencerminkan nilai dan pesan brand Anda.",
    icon: <FaPenNib className="h-8 w-8" />,
    image: "/placeholder.svg?height=400&width=600",
    features: [
      "Desain logo dan identitas brand",
      "UI/UX design untuk website dan aplikasi",
      "Materi pemasaran digital dan cetak",
      "Ilustrasi dan infografis kustom",
      "Panduan brand yang komprehensif",
    ],
    link: "/products?category=design",
  },
  {
    id: "marketing",
    name: "Digital Marketing",
    description:
      "Tingkatkan visibilitas online dan pertumbuhan bisnis Anda dengan strategi pemasaran digital kami yang komprehensif. Kami membantu Anda menjangkau audiens yang tepat dan mengubah prospek menjadi pelanggan setia.",
    icon: <FaChartLine className="h-8 w-8" />,
    image: "/placeholder.svg?height=400&width=600",
    features: [
      "Optimasi mesin pencari (SEO)",
      "Pemasaran media sosial",
      "Kampanye iklan berbayar",
      "Email marketing",
      "Analisis dan pelaporan performa",
    ],
    link: "/products?category=marketing",
  },
  {
    id: "support",
    name: "Support & Maintenance",
    description:
      "Jangan biarkan masalah teknis menghambat bisnis Anda. Layanan dukungan dan pemeliharaan kami memastikan website dan sistem Anda berjalan lancar, aman, dan selalu up-to-date.",
    icon: <FaHeadphones className="h-8 w-8" />,
    image: "/placeholder.svg?height=400&width=600",
    features: [
      "Pemeliharaan website rutin",
      "Pembaruan keamanan",
      "Backup dan pemulihan data",
      "Pemantauan performa",
      "Dukungan teknis responsif",
    ],
    link: "/products?category=support",
  },
]

export default function ServiceCategoryHero() {
  const [activeCategory, setActiveCategory] = useState<string>("website")

  const currentCategory = serviceCategories.find((cat) => cat.id === activeCategory)

  return (
    <section className="bg-white py-20 dark:bg-gray-900" id="services">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Layanan <span className="text-primary">Unggulan</span> Kami
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Solusi digital komprehensif untuk membantu bisnis Anda tumbuh dan berkembang
            </p>
          </motion.div>
        </div>

        {/* Category Tabs */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {serviceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 text-base font-medium transition-all ${
                activeCategory === category.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="hidden sm:inline">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Category Content */}
        {currentCategory && (
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              key={`content-${currentCategory.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="order-2 md:order-1"
            >
              <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{currentCategory.name}</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">{currentCategory.description}</p>

              <ul className="mb-8 space-y-3">
                {currentCategory.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <svg
                      className="mr-2 h-5 w-5 flex-shrink-0 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Link
                href={currentCategory.link}
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary-dark"
              >
                <span>Lihat Paket {currentCategory.name}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              key={`image-${currentCategory.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="order-1 md:order-2"
            >
              <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
                <Image
                  src={currentCategory.image || "/placeholder.svg"}
                  alt={currentCategory.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 max-w-xs">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary">
                    {currentCategory.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white">{currentCategory.name}</h4>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}
