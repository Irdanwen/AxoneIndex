"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type GlowButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type GlowButtonSize = "sm" | "md" | "lg";
type GlowButtonGlow = "accent" | "flounce" | "white";

type GlowButtonElement = HTMLButtonElement | HTMLAnchorElement;

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: GlowButtonVariant;
  size?: GlowButtonSize;
  glowColor?: GlowButtonGlow;
  asChild?: boolean;
}

const MotionButton = motion.button;
const MotionSlot = motion(Slot);

export const GlowButton = React.forwardRef<GlowButtonElement, GlowButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      glowColor = "accent",
      className,
      asChild = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "relative font-inter font-bold uppercase tracking-wider transition-all duration-300 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-axone-dark";

    const sizeClasses: Record<GlowButtonSize, string> = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantClasses: Record<GlowButtonVariant, string> = {
      primary: "bg-gradient-to-r from-axone-accent to-axone-accent-dark text-axone-dark",
      secondary: "bg-transparent border-2 border-axone-flounce text-white-pure",
      ghost: "bg-transparent text-white-pure",
      outline:
        "bg-transparent text-axone-accent border border-axone-accent hover:bg-axone-accent hover:text-white-pure",
      destructive:
        "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
    };

    const glowClasses: Record<GlowButtonGlow, string> = {
      accent: "hover:shadow-[0_0_30px_rgba(250,176,98,0.5)] focus:ring-axone-accent",
      flounce: "hover:shadow-[0_0_30px_rgba(74,140,140,0.5)] focus:ring-axone-flounce",
      white: "hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] focus:ring-white",
    };

    const Component = asChild ? MotionSlot : MotionButton;

    return (
      <Component
        ref={ref}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          glowClasses[glowColor],
          className
        )}
        type={asChild ? undefined : type}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-axone-accent/20 via-axone-flounce/20 to-axone-accent/20 blur-xl" />
        </div>

        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </Component>
    );
  }
);

GlowButton.displayName = "GlowButton";

export default GlowButton;
