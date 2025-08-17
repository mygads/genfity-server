import type { Menu } from "@/types/menu"

const menuData: Menu[] = [
  {
    id: 1,
    title: "explore",
    newTab: false,
    submenu: [
      { id: 11, title: "aboutUs", path: "/about", newTab: false },
      { id: 12, title: "faq", path: "/faq", newTab: false },
      { id: 13, title: "blog", path: "#", newTab: false },
      { id: 14, title: "career", path: "#", newTab: false },
    ],
  },
  {
    id: 2,
    title: "services",
    newTab: false,    megaMenu: [
      {
        title: "mainProducts",
        items: [
          {
            id: 21,
            title: "customWebsite",
            path: "/layanan/custom-website",
            newTab: false,
            icon: "FiMonitor",
            desc: "customWebsiteDesc",
          },
          {
            id: 22,
            title: "webApp",
            path: "/layanan/web-app",
            newTab: false,
            icon: "FiGlobe",
            desc: "webAppDesc",
          },
          {
            id: 23,
            title: "companySystem",
            path: "/layanan/sistem-perusahaan",
            newTab: false,
            icon: "FiDatabase",
            desc: "companySystemDesc",
          },
          {
            id: 24,
            title: "graphicDesign",
            path: "/layanan/desain-grafis",
            newTab: false,
            icon: "FiPenTool",
            desc: "graphicDesignDesc",
          },
        ],
      },
      {
        title: "whatsappServices",
        items: [
          {
            id: 25,
            title: "whatsappAPI",
            path: "/layanan/whatsapp-api",
            newTab: false,
            icon: "FiMessageSquare",
            desc: "whatsappAPIDesc",
          },
          {
            id: 26,
            title: "whatsappChatbot",
            path: "/layanan/whatsapp-chatbot-ai",
            newTab: false,
            icon: "FiMessageCircle",
            desc: "whatsappChatbotDesc",
          },
        ],
      },
      {
        title: "others",
        items: [
          {
            id: 27,
            title: "seoSpecialist",
            path: "/layanan/seo-specialist",
            newTab: false,
            icon: "FiTrendingUp",
            desc: "seoSpecialistDesc",
          },
          {
            id: 28,
            title: "socialMedia",
            path: "/layanan/social-media",
            newTab: false,
            icon: "FiShare2",
            desc: "socialMediaDesc",
          },
          {
            id: 29,
            title: "googleBusiness",
            path: "/layanan/google-bisnis",
            newTab: false,
            icon: "FiMapPin",
            desc: "googleBusinessDesc",
          },
          {
            id: 30,
            title: "companyProfile",
            path: "/layanan/company-profile",
            newTab: false,
            icon: "FiFileText",
            desc: "companyProfileDesc",
          },
          {
            id: 31,
            title: "corporateBranding",
            path: "/layanan/corporate-branding",
            newTab: false,
            icon: "FiBriefcase",
            desc: "corporateBrandingDesc",
          },
          {
            id: 32,
            title: "techSupport",
            path: "/layanan/tech-support",
            newTab: false,
            icon: "FiHeadphones",
            desc: "techSupportDesc",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "pricing",
    path: "/products",
    newTab: false,
  },
  {
    id: 4,
    title: "portfolio",
    path: "/portofolio",
    newTab: false,
  },
  {
    id: 5,
    title: "howToOrder",
    path: "/how-to-order",
    newTab: false,
  },
  {
    id: 6,
    title: "contact",
    path: "/contact",
    newTab: false,
  },
]
export default menuData
