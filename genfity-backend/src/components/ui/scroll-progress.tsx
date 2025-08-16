"use client";

import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "motion/react";

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn(
        "fixed inset-x-0 z-[1000] h-1 origin-left bg-gradient-to-r dark:from-stone-800 dark:via-stone-600 dark:to-stone-500 from-slate-300 via-slate-400 to-slate-600",
        className
      )}
      style={{
        scaleX,
      }}
    />
  );
}
