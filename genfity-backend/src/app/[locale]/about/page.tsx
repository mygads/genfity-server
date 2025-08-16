// import AboutSectionOne from "@/components/About/AboutSectionOne";
// import AboutSectionTwo from "@/components/About/AboutSectionTwo";
// import Breadcrumb from "@/components/Common/Breadcrumb";

// import { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "About",
// };

// const AboutPage = () => {
//   return (
//     <>
      <Breadcrumb
        pageName="About Us"
        description="Our range of innovative tech services is designed to streamline your operations, improve efficiency, and position your business as a leader in your industry."
      />
//       <AboutSectionOne />
//       <AboutSectionTwo />
//     </>
//   );
// };

// export default AboutPage;



import Image from "next/image"
import { CheckCircle, MapPin, Mail, Phone } from "lucide-react"
import ClientSlider from "@/components/Sections/ClientSlider"
import ContactSection from "@/components/Sections/ContactSection"
import AboutHero from "@/components/Sections/about/AboutHero"
import WhoWeAre from "@/components/Sections/about/WhoWeAre"
import OurGoals from "@/components/Sections/about/OurGoals"
import WhyChooseUs from "@/components/Sections/about/WhyChooseUs"
import ClientLogos from "@/components/Sections/about/ClientLogos"
import ClientReviews from "@/components/Sections/about/ClientReviews"
import CompanyLegality from "@/components/Sections/about/CompanyLegality"
import FreeConsultation from "@/components/Sections/about/FreeConsultation"
import LocationMap from "@/components/Sections/about/LocationMap"
import Breadcrumb from "@/components/Common/Breadcrumb"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - Genfity | Software House & Digital Marketing",
  description: "Tentang Genfity, partner digital terpercaya untuk transformasi bisnis Anda. Software house dan digital marketing agency dengan pengalaman bertahun-tahun.",
  keywords: "about genfity, software house, digital marketing, web development, tentang kami",
}

export default function AboutPage() {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="About Us"
        description="Tentang Genfity - Partner digital terpercaya untuk transformasi bisnis Anda di era digital."
      />
      
      {/* Hero Section */}
      <AboutHero />
      
      {/* Siapa Kita */}
      <WhoWeAre />
      
      {/* Tujuan */}
      <OurGoals />
      
      {/* Kenapa Harus Kita */}
      <WhyChooseUs />
      
      {/* Slider Logo Client */}
      <ClientLogos />
      
      {/* Review */}
      <ClientReviews />
      
      {/* Legalitas Perusahaan */}
      <CompanyLegality />
        {/* Hubungi Kami Jika Belum Ada Layanan Sesuai + Free Consultant */}
      <FreeConsultation />
      
      {/* Lokasi */}
      <LocationMap />
    </>
  )
}
