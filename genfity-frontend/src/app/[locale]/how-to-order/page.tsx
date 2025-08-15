import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Breadcrumb from "@/components/Common/Breadcrumb";
import HeroSection from "@/components/HowToOrder/HeroSection";
import OrderingProcess from "@/components/HowToOrder/OrderingProcess";
import MainWorkflow from "@/components/HowToOrder/MainWorkflow";
import RevisionProcess from "@/components/HowToOrder/RevisionProcess";
import WhatsAppApiWorkflow from "@/components/HowToOrder/WhatsAppApiWorkflow";
import HelpSection from "@/components/HowToOrder/HelpSection";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HowToOrder" });
  
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function HowToOrderPage({ params }: Props) {
  const { locale } = await params;
  // Enable static rendering
  setRequestLocale(locale);
  
  const t = await getTranslations("HowToOrder");

  return (
    <>
      <Breadcrumb
        pageName={t("title")}
        description={t("subtitle")}
      />
      
      <HeroSection />
      <OrderingProcess />
      <MainWorkflow />
      <RevisionProcess />
      <WhatsAppApiWorkflow />
      <HelpSection />
    </>
  );
}
