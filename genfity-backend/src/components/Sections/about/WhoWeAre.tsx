"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { CheckCircle } from 'lucide-react'

export default function WhoWeAre() {
  return (    <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative h-[350px] sm:h-[450px] lg:h-[500px] w-full overflow-hidden rounded-lg">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Our Team Working"
                width={600}
                height={500}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 h-48 w-48 rounded-lg bg-primary/10"></div>
            <div className="absolute -top-6 -left-6 h-48 w-48 rounded-lg bg-primary/10"></div>
          </motion.div>

          {/* Right Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >            <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Siapa <span className="text-primary">Kami</span>
            </h2>

            <p className="mb-4 sm:mb-6 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Kami adalah tim profesional yang berdedikasi untuk membantu bisnis Anda bertransformasi di era digital.
              Dengan kombinasi keahlian teknis dan pemahaman bisnis yang mendalam, kami menawarkan solusi digital yang
              komprehensif dan disesuaikan dengan kebutuhan spesifik Anda.
            </p>

            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Didirikan pada tahun 2013, perusahaan kami telah berkembang menjadi salah satu penyedia layanan digital
              terkemuka di Indonesia. Kami bangga dengan pendekatan kami yang berfokus pada klien dan komitmen kami
              terhadap kualitas dan inovasi.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Tim profesional berpengalaman",
                "Solusi yang disesuaikan",
                "Teknologi terkini",
                "Dukungan berkelanjutan",
                "Hasil yang terukur",
                "Komitmen pada kualitas",
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
