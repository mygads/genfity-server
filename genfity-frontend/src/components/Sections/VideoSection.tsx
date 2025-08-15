"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play } from "lucide-react"

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

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
              Kami Siap <span className="text-primary">Membantu</span> Anda
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Lihat bagaimana tim kami bekerja untuk memberikan solusi website terbaik untuk bisnis Anda
            </p>
          </motion.div>
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative aspect-video overflow-hidden rounded-xl bg-gray-900"
          >
            {isPlaying ? (
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Video Presentation"
                className="absolute h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/placeholder.svg?height=720&width=1280')" }}
                ></div>
                <div className="absolute inset-0 bg-black/40"></div>
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-110"
                >
                  <Play className="h-8 w-8" fill="white" />
                </button>
                <div className="absolute bottom-8 left-8 max-w-md text-white">
                  <h3 className="mb-2 text-2xl font-bold">Proses Pembuatan Website</h3>
                  <p className="text-white/80">
                    Lihat bagaimana kami mengubah ide Anda menjadi website yang menarik dan fungsional
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
