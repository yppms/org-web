import { ReactNode } from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  /** "page" fills the viewport height (route-level loading); "section" is inline (py-12). */
  variant?: "page" | "section";
  size?: SpinnerSize;
  /** Optional caption shown under the spinner, e.g. "Memuat...". */
  label?: ReactNode;
}

const sizeClass: Record<SpinnerSize, string> = {
  sm: "loading-sm",
  md: "loading-md",
  lg: "loading-lg",
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
      <div className="text-center">
        <span className={`loading loading-spinner ${sizeClass[size]} text-primary`} />
        {label && <p className="mt-4 text-base-content/70">{label}</p>}
      </div>
    </div>
  );
}
