"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

const AboutSectionTwo = () => {
  const [index, setIndex] = useState(0);

  const svgArray = ["bike", "support", "upgrade"];

  // Animation variants
  const variants = {
    initial: { opacity: 0, scale: 0.8, x: -200, y: -100 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0 },
  };

  return (
    <section className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="mx-4 flex flex-wrap items-center justify-center">
          <div className="w-full px-4 lg:w-1/2">
            <motion.div
              key={index} // Change key to index to trigger re-mounting
              className="relative mx-auto mb-12 aspect-[25/24] max-w-[500px] text-center lg:m-0 p-6"
              initial="initial"
              animate="animate"
              variants={variants}
              transition={{ duration: 0.5 }} // Adjust duration as needed
            >
              <Image
                src={`/images/about/${svgArray[index]}.svg`}
                alt="about image"
                fill
                className="drop-shadow-three dark:drop-shadow-none"
              />
            </motion.div>
          </div>
          <div className="w-full px-4 lg:w-[480px]">
            <div className="max-w-[470px] space-y-3 transition-colors duration-150">
              <div
                className={cn(
                  "cursor-pointer hover:bg-primary/15 p-4 rounded-xl"
                )}
                onClick={() => setIndex(0)}
              >
                <h3
                  className={cn(
                    "mb-4 text-xl font-bold sm:text-2xl lg:text-xl xl:text-2xl",
                    index === 0 && "text-primary"
                  )}
                >
                  Flawless Execution
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Our custom solutions are designed to deliver seamless,
                  bug-free performance, ensuring your business operations run
                  smoothly and efficiently.
                </p>
              </div>
              <div
                className={cn(
                  "cursor-pointer hover:bg-primary/15 p-4 rounded-xl"
                )}
                onClick={() => setIndex(1)}
              >
                <h3
                  className={cn(
                    "mb-4 text-xl font-bold sm:text-2xl lg:text-xl xl:text-2xl",
                    index === 1 && "text-primary"
                  )}
                >
                  Dedicated Support
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  With our expert team by your side, we provide unmatched
                  support to help your business overcome challenges and achieve
                  success effortlessly.
                </p>
              </div>
              <div
                className={cn(
                  "hover:bg-primary/15 p-4 rounded-xl cursor-pointer"
                )}
                onClick={() => setIndex(2)}
              >
                <h3
                  className={cn(
                    "mb-4 text-xl font-bold sm:text-2xl lg:text-xl xl:text-2xl",
                    index === 2 && "text-primary"
                  )}
                >
                  Tailored Innovation
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Leveraging advanced technologies like AI, IoT, and SaaS, we
                  craft solutions tailored to meet your unique business needs
                  and goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;
