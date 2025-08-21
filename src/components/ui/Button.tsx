import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        // Bouton principal avec dégradé Axone
        default: [
          "bg-gradient-to-br from-[#fab062] via-[#e89a4a] to-[#4a8c8c]",
          "text-white font-bold shadow-lg shadow-[#fab062]/25",
          "hover:shadow-xl hover:shadow-[#fab062]/40 hover:scale-[1.02]",
          "active:scale-[0.98] active:shadow-md",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-100%] before:skew-x-[25deg] before:transition-transform before:duration-700",
          "hover:before:translate-x-[100%]",
          "focus:ring-[#fab062]/50"
        ],
        
        // Bouton destructif élégant
        destructive: [
          "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
          "text-white font-bold shadow-lg shadow-red-500/25",
          "hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-100%] before:skew-x-[25deg] before:transition-transform before:duration-700",
          "hover:before:translate-x-[100%]"
        ],
        
        // Bouton outline Axone
        outline: [
          "border-2 border-[#4a8c8c] bg-transparent text-[#4a8c8c]",
          "shadow-lg shadow-[#4a8c8c]/10",
          "hover:bg-gradient-to-br hover:from-[#4a8c8c]/10 hover:to-[#fab062]/10",
          "hover:border-[#fab062] hover:text-[#fab062] hover:scale-[1.02]",
          "hover:shadow-xl hover:shadow-[#4a8c8c]/20",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#4a8c8c]/0 before:via-[#4a8c8c]/5 before:to-[#fab062]/0",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100"
        ],
        
        // Bouton secondaire avec effet verre
        secondary: [
          "bg-gradient-to-br from-[#011f26]/80 via-[#02323a]/60 to-[#034a56]/80",
          "backdrop-blur-lg border border-white/10 text-white",
          "shadow-lg shadow-[#011f26]/25",
          "hover:bg-gradient-to-br hover:from-[#011f26]/90 hover:via-[#02323a]/70 hover:to-[#034a56]/90",
          "hover:border-[#4a8c8c]/30 hover:scale-[1.02]",
          "hover:shadow-xl hover:shadow-[#4a8c8c]/20",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#4a8c8c]/10 before:to-transparent",
          "before:translate-x-[-100%] before:transition-transform before:duration-500",
          "hover:before:translate-x-[100%]"
        ],
        
        // Bouton ghost élégant
        ghost: [
          "bg-transparent text-[#fab062] hover:text-white",
          "hover:bg-gradient-to-br hover:from-[#fab062]/20 hover:to-[#4a8c8c]/20",
          "hover:backdrop-blur-sm hover:scale-[1.02]",
          "active:scale-[0.98]",
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#fab062]/10 before:to-transparent",
          "before:translate-x-[-100%] before:transition-transform before:duration-500",
          "hover:before:translate-x-[100%]"
        ],
        
        // Bouton link stylé
        link: [
          "text-[#fab062] underline-offset-4 font-medium",
          "hover:text-[#4a8c8c] hover:underline",
          "relative after:absolute after:bottom-0 after:left-0 after:h-0.5",
          "after:w-0 after:bg-gradient-to-r after:from-[#fab062] after:to-[#4a8c8c]",
          "after:transition-all after:duration-300",
          "hover:after:w-full"
        ],
        
        // Nouveau : Bouton premium avec effet holographique
        premium: [
          "bg-gradient-to-br from-[#fab062] via-[#4a8c8c] to-[#011f26]",
          "text-white font-bold shadow-xl shadow-[#fab062]/30",
          "border border-white/20",
          "hover:shadow-2xl hover:shadow-[#fab062]/50 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r",
          "before:from-transparent before:via-white/30 before:to-transparent",
          "before:translate-x-[-200%] before:skew-x-[25deg] before:transition-transform before:duration-1000",
          "hover:before:translate-x-[200%]",
          "after:absolute after:inset-0 after:bg-gradient-to-br after:from-[#fab062]/20 after:to-[#4a8c8c]/20",
          "after:opacity-0 after:transition-opacity after:duration-300",
          "hover:after:opacity-100"
        ],
        
        // Nouveau : Bouton success
        success: [
          "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
          "text-white font-bold shadow-lg shadow-emerald-500/25",
          "hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-100%] before:skew-x-[25deg] before:transition-transform before:duration-700",
          "hover:before:translate-x-[100%]"
        ]
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 rounded-lg px-4 py-2 text-xs",
        lg: "h-14 rounded-2xl px-10 py-3.5 text-base font-bold",
        icon: "h-11 w-11 rounded-xl",
        md: "h-12 px-8 py-3 text-sm",
        xl: "h-16 rounded-2xl px-12 py-4 text-lg font-bold"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 