"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { FileText, Award, CheckCircle } from 'lucide-react'

// Sample legal documents - replace with actual company legal documents
const legalDocuments = [
  {
    title: "Akta Pendirian Perusahaan",
    description: "Dokumen resmi pendirian perusahaan",
    icon: FileText,
  },
  {
    title: "SIUP (Surat Izin Usaha Perdagangan)",
    description: "Izin resmi untuk menjalankan usaha perdagangan",
    icon: FileText,
  },
  {
    title: "TDP (Tanda Daftar Perusahaan)",
    description: "Bukti pendaftaran perusahaan",
    icon: FileText,
  },
  {
    title: "NPWP Perusahaan",
    description: "Nomor Pokok Wajib Pajak perusahaan",
    icon: FileText,
  },
]

// Sample certifications - replace with actual company certifications
const certifications = [
  {
    title: "ISO 9001:2015",
    description: "Sertifikasi Sistem Manajemen Mutu",
    icon: Award,
  },
  {
    title: "ISO 27001:2013",
    description: "Sertifikasi Sistem Manajemen Keamanan Informasi",
    icon: Award,
  },
]

export default function CompanyLegality() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Legalitas <span className="text-primary">Perusahaan</span>
            </h2>
            <p className="mb-8 sm:mb-10 lg:mb-12 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Kami adalah perusahaan yang terdaftar secara resmi dan memiliki semua dokumen legal yang diperlukan
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2">
          {/* Legal Documents */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >            <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dokumen Legal</h3>

            <div className="space-y-4 sm:space-y-6">
              {legalDocuments.map((doc, index) => (
                <div key={index} className="flex rounded-lg bg-white p-3 sm:p-4 shadow-sm dark:bg-gray-900">
                  <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <doc.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{doc.title}</h4>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{doc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >            <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Sertifikasi</h3>

            <div className="space-y-4 sm:space-y-6">
              {certifications.map((cert, index) => (
                <div key={index} className="flex rounded-lg bg-white p-3 sm:p-4 shadow-sm dark:bg-gray-900">
                  <div className="mr-3 sm:mr-4 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <cert.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{cert.title}</h4>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{cert.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-gray-900">
              <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Kepatuhan & Etika Bisnis</h4>
              <div className="space-y-2 sm:space-y-3">
                {[
                  "Kami mematuhi semua peraturan dan undang-undang yang berlaku",
                  "Kami menjalankan bisnis dengan integritas dan transparansi",
                  "Kami menjaga kerahasiaan data klien dengan standar keamanan tinggi",
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
