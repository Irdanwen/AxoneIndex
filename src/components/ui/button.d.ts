import React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "premium" | "destructive" | "secondary" | "link" | "success"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>
