"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

type FaqItem = {
  question: string
  answer: string
  category: string
}

const faqItems: FaqItem[] = [
  // Website Development FAQs
  {
    question: "Berapa lama waktu yang dibutuhkan untuk membuat website?",
    answer:
      "Waktu pengembangan website bervariasi tergantung pada kompleksitas dan fitur yang diinginkan. Website landing page sederhana dapat selesai dalam 1-2 minggu, sementara website e-commerce atau sistem perusahaan yang kompleks dapat membutuhkan waktu 1-3 bulan.",
    category: "website",
  },
  {
    question: "Apakah saya akan mendapatkan domain dan hosting?",
    answer:
      "Ya, kami menyediakan layanan domain dan hosting sebagai bagian dari paket kami. Kami akan membantu Anda memilih dan mengatur domain yang sesuai dengan brand Anda, serta menyediakan hosting yang andal dan aman untuk website Anda.",
    category: "website",
  },
  {
    question: "Apakah website yang dibuat responsif untuk mobile?",
    answer:
      "Tentu saja! Semua website yang kami kembangkan dirancang dengan pendekatan mobile-first dan sepenuhnya responsif. Website Anda akan tampil dan berfungsi dengan baik di semua perangkat, termasuk desktop, tablet, dan smartphone.",
    category: "website",
  },
  {
    question: "Apakah saya bisa mengupdate konten website sendiri?",
    answer:
      "Ya, kami mengimplementasikan sistem manajemen konten (CMS) yang user-friendly, memungkinkan Anda untuk memperbarui konten website dengan mudah tanpa pengetahuan teknis. Kami juga menyediakan panduan dan pelatihan singkat untuk menggunakan CMS.",
    category: "website",
  },
  {
    question: "Apakah website saya akan aman dari serangan cyber?",
    answer:
      "Keamanan adalah prioritas utama kami. Kami menerapkan praktik keamanan terbaik, termasuk SSL, perlindungan dari injeksi SQL, dan pembaruan keamanan rutin. Untuk kebutuhan keamanan tingkat lanjut, kami juga menawarkan paket keamanan premium.",
    category: "website",
  },

  // Design FAQs
  {
    question: "Apa format file desain yang akan saya terima?",
    answer:
      "Untuk desain logo dan branding, Anda akan menerima file dalam format vektor (AI, EPS, SVG) dan raster (PNG, JPG) dengan resolusi tinggi. Untuk desain UI/UX, Anda akan menerima file dalam format yang dapat digunakan langsung oleh developer (Figma, Sketch, atau XD).",
    category: "design",
  },
  {
    question: "Berapa banyak revisi yang tersedia untuk desain?",
    answer:
      "Jumlah revisi bervariasi tergantung paket yang Anda pilih. Paket Basic biasanya mencakup 2 revisi, paket Premium mencakup 3-5 revisi, dan paket Enterprise menawarkan revisi yang lebih fleksibel. Revisi tambahan dapat diminta dengan biaya tambahan.",
    category: "design",
  },
  {
    question: "Apakah saya akan mendapatkan hak cipta penuh atas desain?",
    answer:
      "Ya, setelah proyek selesai dan pembayaran lunas, Anda akan mendapatkan hak cipta penuh atas semua desain yang dibuat khusus untuk Anda. Anda bebas menggunakannya untuk keperluan bisnis Anda tanpa batasan.",
    category: "design",
  },

  // Marketing FAQs
  {
    question: "Bagaimana cara mengukur keberhasilan kampanye marketing?",
    answer:
      "Kami menggunakan berbagai metrik untuk mengukur keberhasilan kampanye, termasuk traffic website, tingkat konversi, engagement di media sosial, dan ROI. Kami menyediakan laporan berkala yang detail dan transparan sehingga Anda dapat melihat hasil nyata dari investasi marketing Anda.",
    category: "marketing",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk melihat hasil SEO?",
    answer:
      "SEO adalah strategi jangka panjang. Biasanya diperlukan waktu 3-6 bulan untuk mulai melihat peningkatan peringkat yang signifikan di mesin pencari. Namun, beberapa hasil awal seperti peningkatan traffic organik mungkin terlihat dalam 1-2 bulan pertama.",
    category: "marketing",
  },
  {
    question: "Apakah Anda menangani konten untuk media sosial?",
    answer:
      "Ya, kami menawarkan layanan manajemen media sosial lengkap, termasuk pembuatan konten, penjadwalan posting, interaksi dengan audiens, dan analisis performa. Kami akan bekerja sama dengan Anda untuk mengembangkan strategi konten yang sesuai dengan brand dan target audiens Anda.",
    category: "marketing",
  },

  // Support FAQs
  {
    question: "Apa yang termasuk dalam layanan maintenance website?",
    answer:
      "Layanan maintenance website kami mencakup pembaruan keamanan rutin, backup data, pemantauan uptime, perbaikan bug, pembaruan plugin/CMS, dan dukungan teknis. Kami juga menawarkan paket maintenance premium dengan layanan tambahan seperti pembaruan konten dan pengoptimalan performa.",
    category: "support",
  },
  {
    question: "Bagaimana cara mendapatkan bantuan teknis jika website bermasalah?",
    answer:
      "Kami menyediakan dukungan teknis melalui email, tiket support, dan telepon (untuk paket premium). Waktu respons bervariasi tergantung paket Anda, mulai dari 24 jam untuk paket Basic hingga respons prioritas dalam 2-4 jam untuk paket Enterprise.",
    category: "support",
  },
  {
    question: "Apakah ada kontrak jangka panjang untuk layanan support?",
    answer:
      "Kami menawarkan layanan support dengan berbagai opsi durasi, mulai dari bulanan hingga tahunan. Kontrak jangka panjang (6-12 bulan) biasanya menawarkan harga yang lebih menguntungkan. Anda dapat memilih opsi yang paling sesuai dengan kebutuhan dan anggaran Anda.",
    category: "support",
  },
]

export default function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<string>("website")
  const [openItems, setOpenItems] = useState<number[]>([])

  const filteredFaqs = faqItems.filter((item) => item.category === activeCategory)

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <section className="bg-gray-50 py-20 dark:bg-gray-800" id="faq">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Pertanyaan yang Sering <span className="text-primary">Diajukan</span>
            </h2>
            <p className="mb-12 text-gray-600 dark:text-gray-300">
              Temukan jawaban untuk pertanyaan umum tentang layanan kami
            </p>
          </motion.div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {["website", "design", "marketing", "support"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {category === "website"
                ? "Website Development"
                : category === "design"
                  ? "Design"
                  : category === "marketing"
                    ? "Marketing"
                    : "Support"}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform dark:text-gray-400 ${
                      openItems.includes(index) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openItems.includes(index) ? "max-h-96 px-6 pb-6" : "max-h-0"
                  }`}
                >
                  <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-600 dark:text-gray-300">Masih punya pertanyaan?</p>
          <a
            href="#contact"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary-dark"
          >
            Hubungi Kami
          </a>
        </div>
      </div>
    </section>
  )
}
