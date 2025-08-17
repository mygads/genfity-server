"use client";

import { HeroData } from "@/static/heroData";
import { GridBeam } from "../ui/grid-beams";
import { useTranslations } from "next-intl";

const Hero = () => {
  const t = useTranslations('HomePage');
  return (
    <>
      <section
        id="home"
        className="relative z-10  flex h-screen items-center justify-center overflow-hidden bg-white pb-16 pt-[120px] bg-grid-black/[0.07] dark:bg-dark dark:bg-grid-white/[0.05] md:pb-[120px] md:pt-[150px] xl:pb-[160px] xl:pt-[180px] 2xl:pb-[200px] 2xl:pt-[210px]"
      >
        <GridBeam className="header container relative z-50 flex items-center justify-center">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[800px] text-center">
                <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight">
                  {t('title')}
                </h1>
                <p className=" mb-12 text-base !leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
                  {HeroData.subtitle}
                </p>
                <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"></div>
              </div>
            </div>
          </div>
        </GridBeam>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-60% to-white dark:to-black" />
      </section>
    </>
  );
};

export default Hero;
