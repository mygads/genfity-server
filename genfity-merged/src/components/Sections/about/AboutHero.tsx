"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Play, Users, Award, Target, Zap } from "lucide-react"

export default function AboutHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-white to-blue-50 dark:from-primary/10 dark:via-gray-900 dark:to-gray-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-ping delay-1000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-12 h-12 bg-primary/20 rounded-xl rotate-45"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-32 w-8 h-8 bg-blue-400/30 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-1/4 w-6 h-6 bg-purple-400/25 rounded-full"
        />
      </div>      <div className="container mx-auto px-4 relative z-10">
        <div className="grid items-center gap-8 lg:gap-16 lg:grid-cols-2">
          {/* Left Column - Enhanced Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:pr-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              Partner Digital Terpercaya
            </motion.div>            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
            >
              <span className="text-gray-900 dark:text-white">Wujudkan</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Visi Digital
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Anda</span>
            </motion.h1>            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              Bersama Genfity, transformasi digital bisnis Anda menjadi kenyataan. 
              Kami menciptakan solusi teknologi yang tidak hanya inovatif, 
              tetapi juga menghasilkan dampak nyata untuk pertumbuhan bisnis Anda.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}              className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-12"
            >
              <button className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-sm sm:text-base">
                <span className="relative z-10">Mulai Konsultasi Gratis</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button className="group flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:border-primary hover:text-primary transition-all duration-300 text-sm sm:text-base">
                <Play className="w-5 h-5 group-hover:text-primary transition-colors" />
                Lihat Portfolio
              </button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {[
                { icon: Users, count: "10+", label: "Tahun Pengalaman", color: "text-blue-600" },
                { icon: Award, count: "150+", label: "Proyek Selesai", color: "text-green-600" },
                { icon: Target, count: "98%", label: "Tingkat Kepuasan", color: "text-purple-600" },
                { icon: Zap, count: "24/7", label: "Support Teknis", color: "text-orange-600" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                  className="text-center group hover:transform hover:scale-105 transition-all duration-300"
                >
                  <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.count}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">              {/* Main Hero Image/Video Area */}
              <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                
                {/* Placeholder for hero content - could be video, animation, or image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 relative"
                    >
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                      <div className="absolute inset-2 border-4 border-dashed border-primary/50 rounded-full"></div>
                      <div className="absolute inset-4 bg-primary/20 rounded-full flex items-center justify-center">
                        <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                      </div>
                    </motion.div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      Inovasi Digital Tanpa Batas
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">
                      Teknologi terdepan untuk masa depan bisnis Anda
                    </p>
                  </div>
                </div>

                {/* Floating Cards */}                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Tim Aktif</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Bersertifikat</span>
                  </div>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  )
}
