import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import React from "react";

const rainbowButtonVariants = cva(
    cn(
        "relative cursor-pointer group transition-all duration-300 overflow-hidden",
        "inline-flex items-center justify-center gap-2 shrink-0",
        "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
        "font-semibold whitespace-nowrap",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        // Rainbow border effect
        "before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-red-500 before:via-purple-500 before:via-blue-500 before:via-green-500 before:to-red-500 before:bg-[length:400%] before:animate-rainbow before:rounded-lg",
        "after:absolute after:inset-[2px] after:rounded-md after:transition-colors after:duration-300",
    ),
    {
        variants: {            variant: {
                default: cn(
                    // Background colors: light mode = black bg, dark mode = white bg
                    "text-white dark:text-black",
                    "after:bg-black dark:after:bg-white",
                    "hover:after:bg-gray-900 dark:hover:after:bg-gray-100",
                ),
                outline: cn(
                    // Outline variant: transparent background with contrasting text
                    "text-black dark:text-white",
                    "after:bg-transparent",
                    "hover:after:bg-black/10 dark:hover:after:bg-white/10",
                ),
                ghost: cn(
                    // Ghost variant: subtle background on hover
                    "text-black dark:text-white",
                    "after:bg-transparent",
                    "hover:after:bg-black/5 dark:hover:after:bg-white/5",
                ),
            },
            size: {
                default: "h-10 px-6 py-2 text-sm",
                sm: "h-8 px-4 text-xs",
                lg: "h-12 px-8 text-base",
                icon: "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

/**
 * Rainbow Button Component
 * 
 * A modern button with animated rainbow border effect using pure Tailwind CSS classes.
 * Supports light/dark mode with proper color contrast.
 * 
 * Features:
 * - Animated rainbow border (red -> purple -> blue -> green -> red)
 * - 3 variants: default (gradient background), outline (transparent background), ghost (no background)
 * - 4 sizes: sm, default, lg, icon
 * - Full dual mode support (light/dark theme)
 * - Accessibility support with focus rings
 * - Smooth hover animations
 * 
 * Usage:
 * ```tsx
 * <RainbowButton>Default Button</RainbowButton>
 * <RainbowButton variant="outline" size="lg">Outline Button</RainbowButton>
 * <RainbowButton variant="ghost" size="sm">Ghost Button</RainbowButton>
 * ```
 */

interface RainbowButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof rainbowButtonVariants> {
    asChild?: boolean;
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
    ({ className, variant, size, asChild = false, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                data-slot="button"
                className={cn(rainbowButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                <span className="relative z-10">{children}</span>
            </Comp>
        );
    },
);

RainbowButton.displayName = "RainbowButton";

export { RainbowButton, rainbowButtonVariants, type RainbowButtonProps };
