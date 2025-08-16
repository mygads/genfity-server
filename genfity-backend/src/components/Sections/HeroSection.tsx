"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="relative overflow-hidden bg-white py-32 md:pt-48 dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-black dark:text-white md:text-5xl lg:text-6xl">
              Solusi <span className="text-primary dark:text-primary-dark">Digitalisasi</span> Bisnis &{" "}
              <span className="text-primary dark:text-primary-dark">Konsultan</span> IT
            </h1>

            <p className="mb-8 text-lg text-gray-600 dark:text-gray-200">
              Transformasikan bisnis Anda dengan solusi digital yang inovatif. Kami menyediakan jasa pembuatan website,
              sistem perusahaan, desain, SEO, dan konsultasi IT profesional.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4">
              {[
                { count: "150+", label: "Project Selesai" },
                { count: "98%", label: "Klien Puas" },
              ].map((stat, index) => (
                <div key={index} className="rounded-lg bg-gray-100 p-4 shadow-sm dark:bg-gray-800">
                  <p className="text-2xl font-bold text-primary dark:text-primary-dark">{stat.count}</p>
                  <p className="text-sm text-black dark:text-gray-200">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              {["React", "Next.js", "Laravel", "Tailwind CSS"].map((tech, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {tech}
                </span>
              ))}
            </div>

            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative overflow-hidden rounded-lg bg-primary px-6 py-3 text-white shadow-lg transition-all hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center font-medium">
                Konsultasi Gratis
                <ArrowRight
                  className={`ml-2 h-4 w-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
                />
              </span>
              <span className="absolute bottom-0 left-0 h-full w-0 bg-primary-dark transition-all duration-300 group-hover:w-full"></span>
            </button>
          </motion.div>

          {/* Right Column - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative h-[500px] w-full overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Digital Business Solutions"
                width={600}
                height={500}
                className="h-full w-full object-cover"
              />

              {/* Floating elements */}
              <div className="absolute -left-6 top-10 rounded-lg bg-white p-3 shadow-lg dark:bg-gray-800">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm font-medium">IT Consulting</span>
              </div>

              <div className="absolute -right-6 bottom-20 rounded-lg bg-white p-3 shadow-lg dark:bg-gray-800">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm font-medium">Digital Solutions</span>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary"></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Business Systems</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Custom & Scalable</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background elements */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10"></div>
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5"></div>
    </section>
  )
}
