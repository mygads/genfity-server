"use client"

import { motion } from "framer-motion"
import { CheckCircle, Coffee, FileText, Lightbulb, Rocket, Settings } from "lucide-react"

const steps = [
  {
    icon: Coffee,
    title: "Konsultasi",
    description: "Diskusi awal untuk memahami kebutuhan dan tujuan bisnis Anda.",
  },
  {
    icon: Lightbulb,
    title: "Perencanaan",
    description: "Menyusun strategi dan rencana pengembangan website.",
  },
  {
    icon: FileText,
    title: "Desain",
    description: "Membuat wireframe dan desain visual yang menarik dan sesuai brand.",
  },
  {
    icon: Settings,
    title: "Pengembangan",
    description: "Mengembangkan website dengan kode bersih dan terstruktur.",
  },
  {
    icon: CheckCircle,
    title: "Pengujian",
    description: "Menguji website di berbagai perangkat dan browser.",
  },
  {
    icon: Rocket,
    title: "Peluncuran",
    description: "Meluncurkan website dan memastikan semuanya berjalan lancar.",
  },
]

export default function HowWeWork() {
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
              Bagaimana <span className="text-primary">Kami Bekerja</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Proses pengembangan website kami yang terstruktur dan efisien
            </p>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 md:left-[80px]"></div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative flex flex-col items-center md:flex-row"
              >
                <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="mt-4 text-center md:ml-8 md:mt-0 md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
