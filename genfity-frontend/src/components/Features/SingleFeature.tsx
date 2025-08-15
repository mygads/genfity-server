"use client";

import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div
      className="w-full cursor-pointer p-4 bg-secondary dark:bg-neutral-800 rounded-xl hover:bg-primary dark:bg-opacity-75 dark:hover:bg-neutral-950 group
    transition-colors duration-200 shadow-md selection:bg-white selection:text-black"
    >
      <div className="wow fadeInUp" data-wow-delay=".15s">
        <div className="mb-6 flex h-[70px] w-[70px] p-3 items-center justify-center rounded-md text-primary group-hover:text-white">
          {icon}
        </div>
        <h3 className="mb-5 text-xl font-bold text-black group-hover:text-white dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
          {title}
        </h3>
        <p className="pr-[10px] text-base font-medium leading-relaxed text-body-color group-hover:text-neutral-200">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
