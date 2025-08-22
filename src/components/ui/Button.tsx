import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none relative overflow-hidden",
  {
    variants: {
      variant: {
        // PRIMARY (CTA principaux) - Sandy Brown uni
        default: [
          "bg-[#fab062] text-white font-bold",
          "hover:bg-[#e89a4a] hover:shadow-md", // Hover 15% plus foncé
          "active:bg-[#d68434]",
          "shadow-sm" // Ombre discrète
        ],
        
        // SECONDARY (actions de soutien) - Bordure Sandy Brown
        outline: [
          "border-2 border-[#fab062] bg-transparent text-[#fab062]",
          "hover:bg-[#ffe8d2] hover:shadow", // Fond sable très léger
          "active:bg-[#ffd9b3]"
        ],
        
        // TERTIAIRE (actions mineures) - Texte Flounce
        ghost: [
          "text-[#4a8c8c] hover:text-[#3a6c6c]",
          "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0",
          "after:bg-[#4a8c8c] after:transition-all after:duration-200",
          "hover:after:w-full" // Soulignement subtil
        ],
        
        // PREMIUM (CTA importants) - Dégradé discret
        premium: [
          "bg-gradient-to-r from-[#fab062] to-[#4a8c8c] text-white font-bold",
          "hover:shadow-md hover:shadow-[#fab062]/20",
          "shadow-sm"
        ],
        
        // Destructif conservé mais simplifié
        destructive: [
          "bg-red-500 text-white",
          "hover:bg-red-600",
          "shadow-sm"
        ],
        
        // Bouton secondaire avec effet verre (simplifié)
        secondary: [
          "bg-[#011f26]/80 backdrop-blur-lg border border-white/10 text-white",
          "hover:bg-[#011f26]/90 hover:border-[#4a8c8c]/30",
          "shadow-sm"
        ],
        
        // Bouton link stylé (simplifié)
        link: [
          "text-[#fab062] underline-offset-4 font-medium",
          "hover:text-[#4a8c8c] hover:underline",
          "relative after:absolute after:bottom-0 after:left-0 after:h-0.5",
          "after:w-0 after:bg-gradient-to-r after:from-[#fab062] after:to-[#4a8c8c]",
          "after:transition-all after:duration-200",
          "hover:after:w-full"
        ],
        
        // Bouton success (simplifié)
        success: [
          "bg-emerald-500 text-white font-bold",
          "hover:bg-emerald-600",
          "shadow-sm"
        ]
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-14 rounded-lg px-10 py-3.5 text-base font-bold",
        icon: "h-11 w-11 rounded-lg"
      }
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