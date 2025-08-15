"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  link: string;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, link, ...props }, ref) => {
  return (
    <Link href={link} className={cn("relative w-28 cursor-pointer", className)}>
      <div className="group relative overflow-hidden rounded-xl bg-background p-x-2 py-1 text-center font-semibold border border-primary dark:border-white/50 dark:hover:border-primary">
        <span className="inline-block translate-x-1 transition-all duration-300 dark:text-white group-hover:translate-x-12 group-hover:opacity-0 text-sm">
          {text}
        </span>
        <div className="absolute top-0 z-10 flex h-full w-full translate-x-6 items-center justify-center gap-2 text-sm text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:opacity-100 dark:bg-primary dark:text-white text-white">
          <span>{text}</span>
          <ArrowRight size={18}/>
        </div>
        <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-full bg-primary dark:bg-primary transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-primary dark:group-hover:bg-primary"></div>
      </div>
    </Link>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
