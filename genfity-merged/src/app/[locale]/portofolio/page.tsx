import { HeroParallax } from "@/components/ui/hero-parallax";
import React from "react";
import { portofolioData } from "./components/portofolioData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portofolio",
};

function PortofolioPage() {
  return <HeroParallax products={portofolioData} />;
}

export default PortofolioPage;