import { ReactNode } from "react";

type AmountTone = "primary" | "error" | "info" | "warning";

interface AmountBadgeProps {
  children: ReactNode;
  tone?: AmountTone;
  className?: string;
}

// Full class strings so Tailwind's JIT keeps them.
const toneClass: Record<AmountTone, string> = {
  primary: "bg-primary/10 text-primary",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
};

/**
 * Compact tonal chip for a money amount. Replaces the ad-hoc saturated
 * gradient pills — a soft tint + bold token-colored text reads cleaner and
 * re-themes with the brand.
 */
export default function AmountBadge({
  children,
  tone = "primary",
  className = "",
}: AmountBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-bold ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
