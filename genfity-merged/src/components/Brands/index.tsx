"use client";

import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";

const Brands = () => {
  const arr = [Logos.butterbytes, Logos.logo, Logos.lure, Logos.pommi_caters];

  return (
    <section className="my-10 md:my-16 lg:my-20" id="brands">
      <Marquee>
        {arr.map((Logo, index) => (
          <div
            key={index}
            className="relative dark:text-white text-black h-full w-fit mx-[4rem] flex items-center justify-start"
          >
            <Image
              src={Logo}
              className=" hover:scale-110 transition-transform duration-200"
              alt={`brand-${index}`}
              width={250}
              height={200}
            />
          </div>
        ))}
      </Marquee>
    </section>
  );
};

const Logos = {
  butterbytes: "/images/brands/butterbytes.svg",
  logo: "logo-dark-mode.svg",
  lure: "/images/brands/lure.svg",
  pommi_caters: "/images/brands/pommi_caters.svg",
};

export default Brands;
