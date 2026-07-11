import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  /** "page" fills the viewport height (route-level loading); "section" is inline (py-12). */
  variant?: "page" | "section";
  size?: SpinnerSize;
  /** Optional caption shown under the spinner, e.g. "Memuat...". */
  label?: ReactNode;
}

const sizeClass: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * Centered loading spinner. Replaces the ~18 hand-copied spinner blocks.
 *   <Spinner variant="page" />          route-level
 *   <Spinner variant="section" label="Memuat..." />   inside a tab/section
 */
export default function Spinner({
  variant = "section",
  size = "lg",
  label,
}: SpinnerProps) {
  const wrapper =
    variant === "page"
      ? "flex min-h-[100dvh] items-center justify-center"
      : "flex items-center justify-center py-12";

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className={`${sizeClass[size]} animate-spin text-primary`} />
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}
