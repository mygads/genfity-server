import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "../../styles/index.css";
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { Providers } from "./providers";
import { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CartProvider } from "@/components/Cart/CartContext";
import { AuthProvider } from "@/components/Auth/AuthContext";
import ConditionalLayoutWrapper from "@/components/Layout/ConditionalLayoutWrapper";
import { ToastProvider } from "@/components/ui/toast";

export async function generateMetadata({params}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});

  return {
    title: {
      template: "%s | Genfity Digital Solutions",
      default: "Genfity Digital Solutions",
    },
    description:
      "",
    metadataBase: new URL("https://genfity.com"),
    alternates: {
      canonical: "https://genfity.com",
      languages: {
        "en": "https://genfity.com/en",
        "id": "https://genfity.com/id",
      },
    },
    icons: {
      icon: "/web-icon.svg",
      shortcut: "/web-icon.svg",
      apple: "/web-icon.svg",
    },
    // manifest: "/manifest.json",
    openGraph: {
      type: "website",
      url: "https://genffity.com",
      title: "Genfity Digital Solutions",
      description:
        "Software House and Digital Marketing Agency in Australia and Indonesia that provides a wide range of services including Web Development, Mobile App Development, UI/UX Design, Digital Marketing, and more.",
      siteName: "Genfity",
      images: [
        {
          url: "https://k0wq6pnnph6kt8et.public.blob.vercel-storage.com/genfity/genfity_meta_images-DeG1eHIDn5ppeJXCaQgZV6zOPzRaqX.png",
        },
      ],
    },
  }
};

export const revalidate = 60;

const inter = Inter({ subsets: ["latin"] });

export default async function LocaleLayout({children, params}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <html suppressHydrationWarning lang={locale}>
      <body className={`bg-white dark:bg-black ${inter.className}`}>
        <Providers>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <NextIntlClientProvider locale={locale}>
                  <ConditionalLayoutWrapper>
                    {children}
                  </ConditionalLayoutWrapper>
                </NextIntlClientProvider>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}



