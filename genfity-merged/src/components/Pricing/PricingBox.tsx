"use client";

import { FlickeringGrid } from "../ui/flickering-grid";

const PricingBox = (props: {
  price: string;
  duration: string;
  packageName: string;
  children: React.ReactNode;
}) => {
  const { price, duration, packageName, children } = props;

  return (
    <div className="group relative w-[420px] rounded-xl border border-neutral-300 bg-white dark:border-neutral-800 dark:bg-black">
      <FlickeringGrid
        className="absolute inset-0 z-0 size-full opacity-35"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.2}
      />
      <div className="relative z-10 flex min-h-[680px] flex-col rounded-xl px-8 py-10 shadow-three">
        <div className="mb-8 border-b border-body-color border-opacity-10 pb-8 dark:border-white dark:border-opacity-10">
          <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">
            {packageName}
          </h3>
          <h4 className="price mb-2 text-[32px] font-bold text-black dark:text-white">
            &#8377;<span className="amount">{price}</span>
            <span className="time text-lg font-medium text-body-color">
              &nbsp;{duration}
            </span>
          </h4>
        </div>
        <div className="flex-grow">{children}</div>
        <div className="mt-8 border-t border-body-color border-opacity-10 pt-8 dark:border-white dark:border-opacity-10">
          <button className="flex w-full items-center justify-center rounded-xl bg-primary p-3 text-base font-semibold text-white transition duration-300 ease-in-out hover:bg-opacity-80">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingBox;
