import * as React from "react";

import { cn } from "@/lib/utils";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Fully-rounded filter/sort pill. Active state inverts to fg background /
 * bg text (per the shadcn redesign mockups).
 */
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "h-7 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = "Chip";

export { Chip };
