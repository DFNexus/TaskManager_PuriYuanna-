import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#22bcb4] text-[#011321] font-semibold hover:bg-[#22bcb4]/85",
        secondary:
          "border-transparent bg-[#ffeacd] text-[#011321] font-semibold hover:bg-[#ffeacd]/85 border border-[#011321]/10",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-semibold",
        outline: "text-foreground border-border",
        // Semantic priority & status levels
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold",
        info:
          "border-transparent bg-[#22bcb4]/15 text-[#006e69] dark:bg-[#22bcb4]/20 dark:text-[#22bcb4] font-semibold",
        purple:
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold",
        // Brand variants
        brand:
          "border-transparent bg-[#22bcb4] text-[#011321] font-bold shadow-xs",
        cream:
          "border-transparent bg-[#ffeacd] text-[#011321] font-bold shadow-xs",
        dark:
          "border-[#22bcb4]/30 bg-[#011321] text-[#ffeacd] font-semibold shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
