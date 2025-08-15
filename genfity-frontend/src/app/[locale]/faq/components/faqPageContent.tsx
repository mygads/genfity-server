"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, Search } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabsContent } from "@radix-ui/react-tabs"
import { Input } from "@/components/ui/input2"
import { Button } from "@/components/ui/button2"


type FaqCategory = {
  id: string
  name: string
}

type FaqItem = {
  question: string
  answer: string
  category: string
}

const categories: FaqCategory[] = [
  { id: "general", name: "Umum" },
  { id: "website", name: "Website Development" },
  { id: "business", name: "Sistem Bisnis" },
  { id: "design", name: "Desain" },
  { id: "marketing", name: "Marketing & SEO" },
  { id: "support", name: "Support & Maintenance" },
  { id: "company", name: "Tentang Perusahaan" },
  { id: "process", name: "Proses Kerja" },
]

const faqItems: FaqItem[] = [
  // General FAQs
  {
    question: "Layanan apa saja yang ditawarkan oleh DigiServe?",
    answer:
      "DigiServe menawarkan berbagai layanan digital yang komprehensif, meliputi pengembangan website, pembuatan sistem bisnis, konsultasi IT, layanan desain, optimasi SEO, dan digital marketing. Kami menyediakan solusi end-to-end untuk kebutuhan digital bisnis Anda.",
    category: "general",
  },
  {
    question: "Bagaimana cara memulai proyek dengan DigiServe?",
    answer:
      "Untuk memulai proyek dengan kami, Anda dapat menghubungi kami melalui formulir kontak di website, email, atau telepon. Tim kami akan segera merespons untuk mengatur konsultasi awal yang gratis. Dalam konsultasi ini, kami akan membahas kebutuhan Anda, menjawab pertanyaan, dan memberikan rekomendasi serta estimasi biaya.",
    category: "general",
  },
  {
    question: "Berapa biaya untuk layanan DigiServe?",
    answer:
      "Biaya layanan kami bervariasi tergantung pada jenis proyek, kompleksitas, dan fitur yang dibutuhkan. Kami menawarkan paket dengan harga yang transparan dan dapat disesuaikan dengan kebutuhan dan anggaran Anda. Untuk mendapatkan penawaran yang akurat, silakan hubungi kami untuk konsultasi gratis.",
    category: "general",
  },
  {
    question: "Apakah DigiServe melayani klien dari luar kota atau luar negeri?",
    answer:
      "Ya, kami melayani klien dari seluruh Indonesia dan juga luar negeri. Dengan memanfaatkan teknologi komunikasi modern seperti video conference, email, dan platform manajemen proyek, kami dapat bekerja sama secara efektif dengan klien dari mana saja.",
    category: "general",
  },
  {
    question: "Apakah saya akan mendapatkan hak cipta penuh atas proyek yang dikerjakan?",
    answer:
      "Ya, setelah proyek selesai dan pembayaran lunas, Anda akan mendapatkan hak cipta penuh atas semua aset digital yang dibuat khusus untuk Anda, termasuk website, sistem, desain, dan konten (kecuali elemen berlisensi pihak ketiga yang digunakan dengan izin).",
    category: "general",
  },

  // Website Development FAQs
  {
    question: "Berapa lama waktu yang dibutuhkan untuk membuat website?",
    answer:
      "Waktu pengembangan website bervariasi tergantung pada kompleksitas dan fitur yang diinginkan. Website landing page sederhana dapat selesai dalam 1-2 minggu, website bisnis dengan fitur standar membutuhkan 2-4 minggu, sementara website e-commerce atau sistem perusahaan yang kompleks dapat membutuhkan waktu 1-3 bulan.",
    category: "website",
  },
  {
    question: "Apakah saya akan mendapatkan domain dan hosting?",
    answer:
      "Ya, kami menyediakan layanan domain dan hosting sebagai bagian dari paket kami. Kami akan membantu Anda memilih dan mengatur domain yang sesuai dengan brand Anda, serta menyediakan hosting yang andal dan aman untuk website Anda. Kami juga menawarkan opsi untuk menggunakan domain dan hosting yang sudah Anda miliki.",
    category: "website",
  },
  {
    question: "Apakah website yang dibuat responsif untuk mobile?",
    answer:
      "Tentu saja! Semua website yang kami kembangkan dirancang dengan pendekatan mobile-first dan sepenuhnya responsif. Website Anda akan tampil dan berfungsi dengan baik di semua perangkat, termasuk desktop, tablet, dan smartphone. Kami melakukan pengujian menyeluruh pada berbagai ukuran layar dan perangkat untuk memastikan pengalaman pengguna yang optimal.",
    category: "website",
  },
  {
    question: "Apakah saya bisa mengupdate konten website sendiri?",
    answer:
      "Ya, kami mengimplementasikan sistem manajemen konten (CMS) yang user-friendly, memungkinkan Anda untuk memperbarui konten website dengan mudah tanpa pengetahuan teknis. Kami juga menyediakan panduan dan pelatihan singkat untuk menggunakan CMS. Untuk website yang lebih kompleks, kami dapat membuat panel admin khusus sesuai kebutuhan Anda.",
    category: "website",
  },
  {
    question: "Apakah website saya akan aman dari serangan cyber?",
    answer:
      "Keamanan adalah prioritas utama kami. Kami menerapkan praktik keamanan terbaik, termasuk SSL, perlindungan dari injeksi SQL, firewall, dan pembaruan keamanan rutin. Untuk kebutuhan keamanan tingkat lanjut, kami juga menawarkan paket keamanan premium yang mencakup pemindaian kerentanan berkala, perlindungan DDoS, dan backup otomatis.",
    category: "website",
  },
  {
    question: "Teknologi apa yang digunakan untuk mengembangkan website?",
    answer:
      "Kami menggunakan teknologi modern dan terbaru dalam pengembangan website, termasuk HTML5, CSS3, JavaScript (React, Next.js), PHP, dan database seperti MySQL atau PostgreSQL. Untuk CMS, kami menggunakan WordPress, Strapi, atau solusi custom tergantung kebutuhan proyek. Kami selalu memilih teknologi yang paling sesuai dengan kebutuhan spesifik proyek Anda.",
    category: "website",
  },
  {
    question: "Apakah website akan dioptimasi untuk SEO?",
    answer:
      "Ya, semua website yang kami kembangkan dioptimasi untuk SEO dari awal. Ini mencakup struktur URL yang bersih, tag meta yang tepat, markup schema, kecepatan loading yang optimal, responsif mobile, dan struktur konten yang SEO-friendly. Kami juga menawarkan layanan SEO lanjutan untuk meningkatkan peringkat website Anda di mesin pencari.",
    category: "website",
  },
  {
    question: "Apakah saya bisa menambahkan fitur baru di kemudian hari?",
    answer:
      "Tentu saja! Kami membangun website dengan arsitektur yang skalabel, memungkinkan penambahan fitur baru di masa depan. Kami dapat membantu Anda mengembangkan dan mengintegrasikan fitur tambahan sesuai dengan perkembangan bisnis Anda. Kami juga menawarkan paket maintenance yang mencakup pengembangan fitur minor secara berkala.",
    category: "website",
  },

  // Business Systems FAQs
  {
    question: "Sistem bisnis apa saja yang dapat dikembangkan oleh DigiServe?",
    answer:
      "Kami dapat mengembangkan berbagai sistem bisnis, termasuk CRM (Customer Relationship Management), ERP (Enterprise Resource Planning), sistem manajemen inventori, sistem manajemen proyek, sistem manajemen SDM, sistem pemesanan dan reservasi, sistem manajemen konten, dashboard analitik, dan sistem custom lainnya sesuai kebutuhan spesifik bisnis Anda.",
    category: "business",
  },
  {
    question: "Apakah sistem bisnis dapat diintegrasikan dengan software yang sudah ada?",
    answer:
      "Ya, kami memiliki keahlian dalam mengintegrasikan sistem baru dengan software atau platform yang sudah Anda gunakan, seperti sistem akuntansi, payment gateway, CRM, atau platform e-commerce. Kami menggunakan API dan metode integrasi modern untuk memastikan aliran data yang lancar antar sistem.",
    category: "business",
  },
  {
    question: "Bagaimana dengan keamanan data dalam sistem bisnis?",
    answer:
      "Kami menerapkan standar keamanan tinggi untuk melindungi data bisnis Anda. Ini mencakup enkripsi data, autentikasi multi-faktor, kontrol akses berbasis peran, audit trail, backup otomatis, dan kepatuhan terhadap regulasi privasi data seperti GDPR atau peraturan lokal yang berlaku. Kami juga melakukan pengujian keamanan secara berkala.",
    category: "business",
  },
  {
    question: "Apakah sistem bisnis dapat diakses dari perangkat mobile?",
    answer:
      "Ya, kami mengembangkan sistem bisnis dengan pendekatan responsive design atau progressive web app (PWA), memungkinkan akses dari berbagai perangkat termasuk smartphone dan tablet. Untuk kebutuhan khusus, kami juga dapat mengembangkan aplikasi mobile native yang terintegrasi dengan sistem bisnis Anda.",
    category: "business",
  },
  {
    question: "Bagaimana proses migrasi data dari sistem lama ke sistem baru?",
    answer:
      "Kami memiliki metodologi migrasi data yang terstruktur, meliputi analisis data sumber, pembersihan dan transformasi data, pengujian migrasi, dan verifikasi. Kami bekerja sama dengan tim Anda untuk memastikan migrasi data berjalan lancar dengan downtime minimal. Kami juga menyediakan pelatihan untuk memastikan transisi yang mulus ke sistem baru.",
    category: "business",
  },
  {
    question: "Apakah ada biaya berlangganan untuk menggunakan sistem bisnis?",
    answer:
      "Struktur biaya tergantung pada jenis sistem dan preferensi Anda. Kami menawarkan opsi pembelian lisensi sekali bayar atau model berlangganan (SaaS). Untuk sistem custom, biasanya ada biaya pengembangan awal dan opsional biaya maintenance bulanan/tahunan. Semua biaya akan dijelaskan secara transparan sebelum proyek dimulai.",
    category: "business",
  },

  // Design FAQs
  {
    question: "Layanan desain apa saja yang ditawarkan oleh DigiServe?",
    answer:
      "Kami menawarkan berbagai layanan desain, termasuk desain UI/UX untuk website dan aplikasi, desain logo dan identitas brand, desain grafis untuk media sosial dan marketing, desain presentasi, desain kemasan produk, dan ilustrasi digital. Semua desain kami dibuat dengan memperhatikan prinsip estetika dan fungsionalitas.",
    category: "design",
  },
  {
    question: "Apa format file desain yang akan saya terima?",
    answer:
      "Untuk desain logo dan branding, Anda akan menerima file dalam format vektor (AI, EPS, SVG) dan raster (PNG, JPG) dengan resolusi tinggi. Untuk desain UI/UX, Anda akan menerima file dalam format yang dapat digunakan langsung oleh developer (Figma, Sketch, atau XD). Kami juga menyediakan style guide dan aset yang diperlukan untuk implementasi.",
    category: "design",
  },
  {
    question: "Berapa banyak revisi yang tersedia untuk desain?",
    answer:
      "Jumlah revisi bervariasi tergantung paket yang Anda pilih. Paket Basic biasanya mencakup 2 revisi, paket Premium mencakup 3-5 revisi, dan paket Enterprise menawarkan revisi yang lebih fleksibel. Revisi tambahan dapat diminta dengan biaya tambahan. Kami bekerja secara iteratif untuk memastikan hasil akhir sesuai dengan visi Anda.",
    category: "design",
  },
  {
    question: "Bagaimana proses desain UI/UX yang dilakukan?",
    answer:
      "Proses desain UI/UX kami meliputi beberapa tahap: riset pengguna dan kompetitor, wireframing, prototyping, desain visual, dan pengujian usability. Kami menggunakan pendekatan user-centered design untuk memastikan produk akhir tidak hanya menarik secara visual tetapi juga intuitif dan mudah digunakan oleh target pengguna Anda.",
    category: "design",
  },
  {
    question: "Apakah DigiServe dapat mendesain ulang website atau aplikasi yang sudah ada?",
    answer:
      "Ya, kami menawarkan layanan redesign untuk website atau aplikasi yang sudah ada. Proses ini dimulai dengan audit UX/UI untuk mengidentifikasi masalah dan peluang peningkatan, dilanjutkan dengan redesign yang mempertahankan elemen positif sambil memperbaiki area yang bermasalah. Kami juga mempertimbangkan feedback pengguna dan data analitik dalam proses redesign.",
    category: "design",
  },

  // Marketing & SEO FAQs
  {
    question: "Layanan SEO apa saja yang ditawarkan oleh DigiServe?",
    answer:
      "Kami menawarkan layanan SEO komprehensif, meliputi audit SEO, optimasi on-page (struktur konten, meta tags, internal linking), optimasi teknis (kecepatan website, mobile-friendliness, struktur URL), optimasi off-page (backlink building, local SEO), riset keyword, content marketing, dan analisis kompetitor. Kami juga menyediakan laporan performa SEO secara berkala.",
    category: "marketing",
  },
  {
    question: "Bagaimana cara mengukur keberhasilan kampanye marketing?",
    answer:
      "Kami menggunakan berbagai metrik untuk mengukur keberhasilan kampanye, termasuk traffic website, tingkat konversi, engagement di media sosial, ROI, cost per acquisition, dan metrik spesifik lainnya sesuai tujuan kampanye. Kami menyediakan dashboard dan laporan berkala yang detail dan transparan sehingga Anda dapat melihat hasil nyata dari investasi marketing Anda.",
    category: "marketing",
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk melihat hasil SEO?",
    answer:
      "SEO adalah strategi jangka panjang. Biasanya diperlukan waktu 3-6 bulan untuk mulai melihat peningkatan peringkat yang signifikan di mesin pencari. Namun, beberapa hasil awal seperti peningkatan traffic organik mungkin terlihat dalam 1-2 bulan pertama. Faktor seperti kompetisi keyword, kondisi website awal, dan otoritas domain juga mempengaruhi timeline hasil.",
    category: "marketing",
  },
  {
    question: "Apakah Anda menangani konten untuk media sosial?",
    answer:
      "Ya, kami menawarkan layanan manajemen media sosial lengkap, termasuk pembuatan konten, penjadwalan posting, interaksi dengan audiens, kampanye berbayar, dan analisis performa. Kami akan bekerja sama dengan Anda untuk mengembangkan strategi konten yang sesuai dengan brand dan target audiens Anda, serta tujuan bisnis spesifik yang ingin dicapai.",
    category: "marketing",
  },
  {
    question: "Apakah DigiServe menangani iklan Google Ads atau Facebook Ads?",
    answer:
      "Ya, kami menawarkan layanan pengelolaan iklan digital yang komprehensif, termasuk Google Ads (Search, Display, YouTube), Facebook/Instagram Ads, LinkedIn Ads, dan platform iklan digital lainnya. Layanan kami mencakup riset keyword, pembuatan materi iklan, pengaturan targeting, optimasi kampanye, A/B testing, dan pelaporan hasil.",
    category: "marketing",
  },
  {
    question: "Bagaimana strategi content marketing yang diterapkan?",
    answer:
      "Strategi content marketing kami dimulai dengan riset audiens dan keyword untuk mengidentifikasi topik yang relevan. Kami kemudian mengembangkan konten berkualitas tinggi dalam berbagai format (blog, infografis, video, ebook) yang memberikan nilai bagi audiens Anda. Konten didistribusikan melalui website, email, media sosial, dan platform relevan lainnya, dengan analisis performa untuk penyempurnaan berkelanjutan.",
    category: "marketing",
  },

  // Support & Maintenance FAQs
  {
    question: "Apa yang termasuk dalam layanan maintenance website?",
    answer:
      "Layanan maintenance website kami mencakup pembaruan keamanan rutin, backup data, pemantauan uptime, perbaikan bug, pembaruan plugin/CMS, dan dukungan teknis. Kami juga menawarkan paket maintenance premium dengan layanan tambahan seperti pembaruan konten, pengoptimalan performa, analisis SEO berkala, dan peningkatan fitur minor.",
    category: "support",
  },
  {
    question: "Bagaimana cara mendapatkan bantuan teknis jika website bermasalah?",
    answer:
      "Kami menyediakan dukungan teknis melalui email, tiket support, dan telepon (untuk paket premium). Waktu respons bervariasi tergantung paket Anda, mulai dari 24 jam untuk paket Basic hingga respons prioritas dalam 2-4 jam untuk paket Enterprise. Untuk masalah kritis yang menyebabkan website down, kami memprioritaskan penanganan segera.",
    category: "support",
  },
  {
    question: "Apakah ada kontrak jangka panjang untuk layanan support?",
    answer:
      "Kami menawarkan layanan support dengan berbagai opsi durasi, mulai dari bulanan hingga tahunan. Kontrak jangka panjang (6-12 bulan) biasanya menawarkan harga yang lebih menguntungkan. Anda dapat memilih opsi yang paling sesuai dengan kebutuhan dan anggaran Anda, dengan fleksibilitas untuk meningkatkan atau menurunkan level layanan sesuai kebutuhan.",
    category: "support",
  },
  {
    question: "Apakah DigiServe menyediakan pelatihan untuk tim internal kami?",
    answer:
      "Ya, kami menawarkan sesi pelatihan untuk tim Anda agar dapat mengelola website atau sistem secara mandiri. Pelatihan dapat mencakup penggunaan CMS, pengelolaan konten, analisis data, atau aspek teknis lainnya sesuai kebutuhan. Pelatihan dapat dilakukan secara langsung atau virtual, dengan materi pelatihan yang dapat disesuaikan dengan level pengetahuan tim Anda.",
    category: "support",
  },
  {
    question: "Bagaimana dengan backup dan pemulihan data?",
    answer:
      "Kami menerapkan sistem backup otomatis untuk website dan sistem yang kami kelola. Backup dilakukan secara berkala (harian, mingguan, atau sesuai kebutuhan) dan disimpan di lokasi yang aman. Dalam kasus kehilangan data atau masalah sistem, kami dapat melakukan pemulihan data dengan downtime minimal. Kami juga dapat menyediakan salinan backup untuk penyimpanan lokal Anda.",
    category: "support",
  },

  // Company FAQs
  {
    question: "Sejak kapan DigiServe berdiri dan bagaimana sejarahnya?",
    answer:
      "DigiServe didirikan pada tahun 2015 oleh sekelompok profesional IT dan digital marketing yang berpengalaman. Berawal dari layanan pengembangan website sederhana, kami terus berkembang dan memperluas layanan untuk menjadi penyedia solusi digital komprehensif. Selama perjalanan kami, kami telah melayani ratusan klien dari berbagai industri dan ukuran bisnis.",
    category: "company",
  },
  {
    question: "Berapa jumlah karyawan DigiServe dan bagaimana struktur timnya?",
    answer:
      "DigiServe memiliki lebih dari 30 profesional yang terdiri dari developer, designer, spesialis SEO, ahli marketing digital, project manager, dan staf support. Tim kami terstruktur berdasarkan spesialisasi dengan pendekatan kolaboratif, memungkinkan kami untuk menangani proyek dari berbagai skala dan kompleksitas dengan efisien.",
    category: "company",
  },
  {
    question: "Apakah DigiServe memiliki sertifikasi atau afiliasi resmi?",
    answer:
      "Ya, DigiServe adalah perusahaan yang terdaftar resmi dengan berbagai sertifikasi dan afiliasi. Kami adalah Google Partner, Microsoft Partner, dan anggota asosiasi digital marketing nasional. Tim kami juga memiliki berbagai sertifikasi individual seperti Google Ads, HubSpot, AWS, dan sertifikasi pengembangan software lainnya.",
    category: "company",
  },
  {
    question: "Klien-klien besar apa saja yang pernah ditangani oleh DigiServe?",
    answer:
      "Kami telah bekerja sama dengan berbagai klien dari startup hingga perusahaan besar. Beberapa klien ternama kami termasuk [Nama Perusahaan 1] (sektor ritel), [Nama Perusahaan 2] (sektor pendidikan), [Nama Perusahaan 3] (sektor kesehatan), dan berbagai UMKM yang telah kami bantu mengembangkan presence digital mereka. Portfolio lengkap dapat dilihat di halaman Portfolio kami.",
    category: "company",
  },
  {
    question: "Apa visi dan misi DigiServe?",
    answer:
      "Visi kami adalah menjadi partner transformasi digital terpercaya yang membantu bisnis dari segala ukuran untuk berkembang di era digital. Misi kami adalah menyediakan solusi digital yang inovatif, berkualitas tinggi, dan terjangkau yang memberikan hasil nyata bagi klien kami, sambil terus beradaptasi dengan perkembangan teknologi dan tren industri.",
    category: "company",
  },

  // Process FAQs
  {
    question: "Bagaimana alur kerja proyek di DigiServe?",
    answer:
      "Alur kerja proyek kami terdiri dari beberapa tahap: 1) Konsultasi awal dan pengumpulan kebutuhan, 2) Proposal dan penawaran, 3) Perencanaan proyek dan pembuatan timeline, 4) Desain dan pengembangan dengan review berkala, 5) Pengujian dan quality assurance, 6) Peluncuran, dan 7) Support pasca-peluncuran. Setiap tahap melibatkan komunikasi yang jelas dengan klien untuk memastikan hasil sesuai harapan.",
    category: "process",
  },
  {
    question: "Bagaimana cara DigiServe mengelola proyek?",
    answer:
      "Kami menggunakan metodologi Agile dengan sprint 1-2 minggu untuk sebagian besar proyek, memungkinkan fleksibilitas dan adaptasi terhadap perubahan kebutuhan. Setiap proyek ditangani oleh tim yang dipimpin oleh project manager yang akan menjadi point of contact utama Anda. Kami menggunakan tools seperti Jira, Trello, atau ClickUp untuk manajemen proyek dan komunikasi.",
    category: "process",
  },
  {
    question: "Seberapa sering update progress diberikan selama proyek berlangsung?",
    answer:
      "Kami memberikan update progress secara reguler, biasanya mingguan untuk proyek standar dan lebih sering untuk proyek yang kompleks atau timeline yang ketat. Update mencakup progress yang telah dicapai, langkah selanjutnya, dan potensi risiko atau masalah. Kami juga mengadakan meeting review di akhir setiap milestone penting.",
    category: "process",
  },
  {
    question: "Bagaimana jika ada perubahan kebutuhan di tengah proyek?",
    answer:
      "Kami memahami bahwa kebutuhan dapat berubah selama proyek berlangsung. Untuk perubahan minor yang masih dalam scope awal, kami dapat mengakomodasi tanpa biaya tambahan. Untuk perubahan yang signifikan atau penambahan fitur baru, kami akan mendiskusikan implikasi terhadap timeline dan biaya sebelum implementasi, memastikan transparansi dan kesepakatan bersama.",
    category: "process",
  },
  {
    question: "Bagaimana proses pembayaran untuk proyek?",
    answer:
      "Struktur pembayaran kami biasanya terdiri dari deposit awal (30-50% dari total biaya) untuk memulai proyek, pembayaran progress di tengah proyek saat milestone tertentu tercapai, dan pembayaran akhir setelah proyek selesai. Untuk proyek besar, kami dapat menawarkan skema pembayaran yang lebih fleksibel. Kami menerima pembayaran melalui transfer bank, kartu kredit, atau metode pembayaran digital lainnya.",
    category: "process",
  },
  {
    question: "Apakah ada garansi untuk pekerjaan yang dilakukan?",
    answer:
      "Ya, kami memberikan garansi untuk semua pekerjaan kami. Untuk website dan sistem, kami menawarkan garansi bug-fixing selama 30-90 hari setelah peluncuran (tergantung kompleksitas proyek). Jika ada masalah teknis yang muncul dalam periode ini, kami akan memperbaikinya tanpa biaya tambahan. Kami juga menawarkan paket maintenance untuk dukungan jangka panjang.",
    category: "process",
  },
]

export default function FaqPageContent() {
  const [activeTab, setActiveTab] = useState<string>("general")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [openItems, setOpenItems] = useState<number[]>([])

  // Filter FAQs based on search query and active tab
  const filteredFaqs = faqItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = activeTab === "all" || item.category === activeTab

    return matchesSearch && matchesCategory
  })

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:pt-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
                Pertanyaan yang Sering <span className="text-primary">Diajukan</span>
              </h1>
              <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
                Temukan jawaban untuk pertanyaan umum tentang layanan kami, proses kerja, dan informasi perusahaan
              </p>

              {/* Search Bar */}
              <div className="mx-auto max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari pertanyaan..."
                    className="w-full rounded-full border-gray-300 pl-10 py-6 text-base focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            {/* Category Tabs */}
            <div className="mb-8">
              <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <TabsList className="mb-6 inline-flex w-max justify-start gap-2 px-1">
                    <TabsTrigger value="all" className="rounded-full px-4 py-2 text-sm sm:text-base">
                      Semua
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="whitespace-nowrap rounded-full px-4 py-2 text-sm sm:text-base"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Combined Content Area */}
                <motion.div
                  key={activeTab} // Animate when tab changes
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4" // Reduced spacing slightly
                >
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => (
                      <FaqItem
                        key={`${activeTab}-${index}`} // Ensure key changes on tab switch for re-animation if needed
                        faq={faq}
                        index={index}
                        isOpen={openItems.includes(index)}
                        toggleItem={toggleItem}
                      />
                    ))
                  ) : (
                    <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                      <Search className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Tidak ada hasil yang ditemukan
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Coba ubah filter kategori atau gunakan kata kunci pencarian yang berbeda.
                      </p>
                    </div>
                  )}
                </motion.div>
              </Tabs>
            </div>

            {/* Contact CTA */}
            <div className="mt-16 rounded-xl bg-primary/10 p-8 text-center dark:bg-primary/5">
              <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Masih punya pertanyaan?</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi tim kami
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/contact">Hubungi Kami</Link>
                </Button>
                <Button variant="outline" size="lg">
                  <Link href="/#pricing">Lihat Paket Layanan</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// FAQ Item Component
function FaqItem({
  faq,
  index,
  isOpen,
  toggleItem,
}: {
  faq: FaqItem
  index: number
  isOpen: boolean
  toggleItem: (index: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        onClick={() => toggleItem(index)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</h3>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px] px-6 pb-6" : "max-h-0"}`}>
        <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
      </div>
    </motion.div>
  )
}
