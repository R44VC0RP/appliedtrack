import * as React from "react"
import { cn } from "@/lib/utils"

interface CircleProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: "small" | "default" | "large"
  variant?: "default" | "destructive" | "warning"
}

export function CircleProgress({
  value,
  size = "default",
  variant = "default",
  className,
  ...props
}: CircleProgressProps) {
  const sizeClasses = {
    small: "w-3 h-3",
    default: "w-4 h-4",
    large: "w-5 h-5"
  }

  const variantClasses = {
    default: "bg-primary",
    destructive: "bg-destructive",
    warning: "bg-yellow-500"
  }

  return (
    <div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{
        background: `conic-gradient(${variantClasses[variant]} ${value}%, transparent ${value}%)`
      }}
      {...props}
    />
  )
} 