"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const comparisonData = [
  {
    feature: "Desain Kustom",
    us: true,
    others: false,
    description: "Desain unik sesuai brand Anda",
  },
  {
    feature: "Responsif di Semua Perangkat",
    us: true,
    others: true,
    description: "Tampilan optimal di desktop, tablet, dan mobile",
  },
  {
    feature: "Waktu Loading Cepat",
    us: true,
    others: false,
    description: "Optimasi performa untuk pengalaman pengguna terbaik",
  },
  {
    feature: "SEO Friendly",
    us: true,
    others: true,
    description: "Struktur kode dan konten yang dioptimalkan untuk mesin pencari",
  },
  {
    feature: "Dukungan Teknis 24/7",
    us: true,
    others: false,
    description: "Tim dukungan siap membantu kapan saja",
  },
  {
    feature: "Update & Maintenance",
    us: true,
    others: false,
    description: "Pemeliharaan rutin untuk keamanan dan performa",
  },
]

export default function ComparisonSection() {
  return (
    <section className="bg-gray-50 py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Bagaimana <span className="text-primary">Kualitas</span> Kami Dibanding yang Lain
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Kami berkomitmen untuk memberikan layanan terbaik dengan standar kualitas tertinggi
            </p>
          </motion.div>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
          <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="col-span-1 font-semibold text-gray-700 dark:text-gray-300">Fitur</div>
            <div className="col-span-1 text-center font-semibold text-primary">Kami</div>
            <div className="col-span-1 text-center font-semibold text-gray-700 dark:text-gray-300">Yang Lain</div>
          </div>

          {comparisonData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className={`grid grid-cols-3 p-4 ${
                index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"
              }`}
            >
              <div className="col-span-1">
                <div className="font-medium text-gray-900 dark:text-white">{item.feature}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                {item.us ? <Check className="h-6 w-6 text-green-500" /> : <X className="h-6 w-6 text-red-500" />}
              </div>
              <div className="col-span-1 flex items-center justify-center">
                {item.others ? <Check className="h-6 w-6 text-green-500" /> : <X className="h-6 w-6 text-red-500" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
