"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Server, Database, Shield, Zap } from "lucide-react"

export default function BusinessSystemsSection() {
  const systems = [
    {
      icon: <Server className="h-8 w-8" />,
      title: "ERP Systems",
      description: "Sistem manajemen sumber daya perusahaan yang terintegrasi untuk mengoptimalkan proses bisnis Anda.",
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "CRM Systems",
      description: "Sistem manajemen hubungan pelanggan untuk meningkatkan layanan dan loyalitas pelanggan.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Inventory Management",
      description: "Sistem pengelolaan inventaris yang efisien untuk mengoptimalkan stok dan mengurangi biaya.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Custom Business Systems",
      description: "Sistem bisnis yang disesuaikan dengan kebutuhan spesifik perusahaan Anda.",
    },
  ]

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
              Sistem <span className="text-primary">Perusahaan</span> yang Efisien
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Kami mengembangkan sistem perusahaan yang disesuaikan dengan kebutuhan bisnis Anda
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {systems.map((system, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-lg bg-white p-6 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-700"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                {system.icon}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">{system.title}</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{system.description}</p>
              <a href="#" className="group inline-flex items-center text-sm font-medium text-primary">
                <span>Pelajari Lebih Lanjut</span>
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="group inline-flex items-center rounded-lg bg-primary px-6 py-3 text-white transition-all hover:bg-primary-dark"
          >
            <span className="font-medium">Lihat Semua Layanan</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
