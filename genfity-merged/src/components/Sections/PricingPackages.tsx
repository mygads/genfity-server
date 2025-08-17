"use client"

import { motion } from "framer-motion"
import { Check, HelpCircle, X } from "lucide-react"

const packages = [
  {
    name: "Basic",
    price: "3.999K",
    description: "Solusi terjangkau untuk bisnis kecil yang baru memulai",
    features: [
      { included: true, text: "5 Halaman Website" },
      { included: true, text: "Desain Responsif" },
      { included: true, text: "Form Kontak" },
      { included: true, text: "SEO Dasar" },
      { included: false, text: "CMS Custom" },
      { included: false, text: "E-Commerce" },
      { included: false, text: "Integrasi API" },
    ],
  },
  {
    name: "Professional",
    price: "7.999K",
    description: "Solusi lengkap untuk bisnis yang sedang berkembang",
    popular: true,
    features: [
      { included: true, text: "10 Halaman Website" },
      { included: true, text: "Desain Responsif Premium" },
      { included: true, text: "Form Kontak & Newsletter" },
      { included: true, text: "SEO Lanjutan" },
      { included: true, text: "CMS Custom" },
      { included: true, text: "E-Commerce Dasar" },
      { included: false, text: "Integrasi API" },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Solusi kustom untuk kebutuhan bisnis yang kompleks",
    features: [
      { included: true, text: "Halaman Tak Terbatas" },
      { included: true, text: "Desain Premium Kustom" },
      { included: true, text: "Form & Fitur Interaktif" },
      { included: true, text: "SEO Komprehensif" },
      { included: true, text: "CMS Enterprise" },
      { included: true, text: "E-Commerce Lengkap" },
      { included: true, text: "Integrasi API & Sistem" },
    ],
  },
]

export default function PricingPackages() {
  return (
    <section className="bg-gray-50 py-20 dark:bg-gray-800" id="pricing">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Berapa Biaya Pembuatan <span className="text-primary">Website</span>?
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Kami menawarkan paket yang fleksibel untuk memenuhi kebutuhan dan anggaran bisnis Anda
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {packages.map((pkg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 ${
                pkg.popular ? "border-2 border-primary" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-white">
                  Paling Populer
                </div>
              )}

              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                <div className="mb-2 flex items-end justify-center">
                  <span className="text-3xl font-bold text-primary">Rp {pkg.price}</span>
                  {pkg.price !== "Custom" && <span className="text-gray-500 dark:text-gray-400">/project</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{pkg.description}</p>
              </div>

              <div className="mb-6 space-y-4">
                {pkg.features.map((feature, i) => (
                  <div key={i} className="flex items-center">
                    {feature.included ? (
                      <Check className="mr-3 h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mr-3 h-5 w-5 text-gray-400" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full rounded-lg px-4 py-2 text-center font-medium transition-colors ${
                  pkg.popular
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {pkg.price === "Custom" ? "Hubungi Kami" : "Pilih Paket"}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <div className="max-w-2xl rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="flex items-start">
              <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Tidak menemukan paket yang sesuai?
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Setiap bisnis memiliki kebutuhan unik. Hubungi kami untuk konsultasi gratis dan penawaran yang
                  disesuaikan dengan kebutuhan spesifik Anda.
                </p>
                <a href="#contact" className="inline-flex items-center text-primary hover:underline">
                  Konsultasi Gratis
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
