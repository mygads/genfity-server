"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const GridBeam: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("relative w-full h-full", className)}>{children}</div>
);
