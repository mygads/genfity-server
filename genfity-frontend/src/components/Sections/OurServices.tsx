"use client"

import { motion } from "framer-motion"
import { Code, Layout, ShoppingBag, Smartphone, Search, Server, Users, Lightbulb } from 'lucide-react'

const services = [
  {
    icon: Layout,
    title: "Website Perusahaan",
    description: "Website profesional untuk meningkatkan kredibilitas dan kehadiran online perusahaan Anda.",
  },
  {
    icon: ShoppingBag,
    title: "E-Commerce",
    description: "Platform e-commerce lengkap dengan sistem pembayaran, manajemen produk, dan analitik.",
  },
  {
    icon: Server,
    title: "Sistem Perusahaan",
    description: "Sistem internal perusahaan yang disesuaikan dengan kebutuhan bisnis Anda.",
  },
  {
    icon: Code,
    title: "Pengembangan API",
    description: "Pengembangan API untuk integrasi dengan sistem dan aplikasi pihak ketiga.",
  },
  {
    icon: Search,
    title: "Jasa SEO",
    description: "Optimasi mesin pencari untuk meningkatkan peringkat website Anda di hasil pencarian.",
  },
  {
    icon: Smartphone,
    title: "Desain UI/UX",
    description: "Desain antarmuka pengguna yang menarik dan pengalaman pengguna yang optimal.",
  },
  {
    icon: Users,
    title: "Konsultasi IT",
    description: "Layanan konsultasi IT untuk membantu Anda menemukan solusi terbaik untuk bisnis Anda.",
  },
  {
    icon: Lightbulb,
    title: "Konsultasi Digital",
    description: "Strategi digital yang komprehensif untuk membantu bisnis Anda berkembang di era digital.",
  },
]

export default function OurServices() {
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
              Layanan <span className="text-primary">Kami</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Kami menawarkan berbagai layanan digitalisasi bisnis untuk memenuhi kebutuhan Anda
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{service.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Lihat Semua Layanan
          </a>
        </div>
      </div>
    </section>
  )
}
