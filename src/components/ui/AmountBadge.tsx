import { ReactNode } from "react";
import { Badge } from "./badge";

type AmountTone = "primary" | "error" | "info" | "warning";

interface AmountBadgeProps {
  children: ReactNode;
  tone?: AmountTone;
  className?: string;
}

const toneVariant: Record<
  AmountTone,
  "default" | "destructive" | "info" | "warning"
> = {
  primary: "default",
  error: "destructive",
  info: "info",
  warning: "warning",
};

/**
 * Compact soft chip for a money amount (mono). Maps tone → the badge's soft
 * status variants so it re-themes with the brand.
 */
export default function AmountBadge({
  children,
  tone = "primary",
  className = "",
}: AmountBadgeProps) {
  return (
    <Badge
      variant={toneVariant[tone]}
      className={`font-mono font-semibold ${className}`}
    >
      {children}
    </Badge>
  );
}
