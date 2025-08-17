"use client"

import { motion } from "framer-motion"
import { Target, Award, Users, TrendingUp } from 'lucide-react'

const goals = [
  {
    icon: Target,
    title: "Misi",
    description:
      "Menyediakan solusi digital inovatif yang membantu bisnis bertransformasi, berkembang, dan mencapai potensi penuh mereka di era digital.",
  },
  {
    icon: Award,
    title: "Visi",
    description:
      "Menjadi partner digital terpercaya yang memimpin transformasi digital bisnis di Indonesia dengan solusi yang inovatif, efektif, dan berkelanjutan.",
  },
  {
    icon: Users,
    title: "Nilai-Nilai Kami",
    description:
      "Integritas, inovasi, kolaborasi, dan keunggulan adalah nilai-nilai inti yang memandu setiap aspek pekerjaan kami.",
  },
  {
    icon: TrendingUp,
    title: "Tujuan Jangka Panjang",
    description:
      "Memperluas jangkauan layanan kami dan membantu lebih banyak bisnis di seluruh Indonesia untuk sukses di era digital.",
  },
]

export default function OurGoals() {
  return (    <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Tujuan <span className="text-primary">Kami</span>
            </h2>
            <p className="mb-8 sm:mb-12 text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Kami memiliki tujuan yang jelas untuk membantu bisnis Anda berkembang di era digital
            </p>
          </motion.div>
        </div>        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {goals.map((goal, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-xl bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
            >
              <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                <goal.icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{goal.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{goal.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
