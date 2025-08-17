"use client";

import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Blog from "@/components/Blog";
import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";

import HeroSection from "@/components/Sections/HeroSection"
import BriefReviews from "@/components/Sections/BriefReviews"
import WhyWebsiteImportant from "@/components/Sections/WhyWebsiteImportant"
import WhyBasicNotEnough from "@/components/Sections/WhyBasicNotEnough"
import WhyAttractive from "@/components/Sections/WhyAttractive"
import CustomBuilt from "@/components/Sections/CustomBuilt"
import ClientSlider from "@/components/Sections/ClientSlider"
import PortfolioSlider from "@/components/Sections/PortfolioSlider"
import PricingPackages from "@/components/Sections/PricingPackages"
import VideoSection from "@/components/Sections/VideoSection"
import OurServices from "@/components/Sections/OurServices"
import BusinessServices from "@/components/Sections/BusinessServices"
import ComparisonSection from "@/components/Sections/ComparisonSection"
import TrustedSection from "@/components/Sections/TrustedSection"
import HowWeWork from "@/components/Sections/HowWeWork"
import ContactSection from "@/components/Sections/ContactSection"
import PromoPopup from "@/components/Popup/PromoPopup"
import DigitalizationSection from "@/components/Sections/DIgitalizationSection";
import ITConsultingSection from "@/components/Sections/ITConsultingSection";
import BusinessSystemsSection from "@/components/Sections/BusinessSystemSection";
import FaqSection from "@/components/Sections/FaqSection";
import ServiceCategoryHero from "@/components/Sections/ServiceCategory";

export default function Home() {
  return (
    <>
      <ScrollUp />
      {/* <Hero />
      <Features />
      <Video />
      <Brands />
      <AboutSectionOne />
      <AboutSectionTwo />
      <Testimonials />
      <Pricing />
      <Blog />
      <Contact /> */}

      <PromoPopup />
      <HeroSection />
      <BriefReviews />
      <ServiceCategoryHero />
      <ITConsultingSection />
      <WhyWebsiteImportant />
      <BusinessSystemsSection />
      <WhyBasicNotEnough />
      <WhyAttractive />
      <CustomBuilt />
      <ClientSlider />
      <PortfolioSlider />
      <PricingPackages />
      <OurServices />
      <BusinessServices />
      <ComparisonSection />
      <TrustedSection />
      <HowWeWork />
      <DigitalizationSection />
      <VideoSection />
      <ContactSection />
      <FaqSection />
    </>
  );
}
