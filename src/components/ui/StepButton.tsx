"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepButtonProps {
  /** Which way it steps; sets the chevron. */
  direction: "prev" | "next";
  /** What a step does, e.g. "Bulan sebelumnya" — the tooltip and the accessible name. */
  label: string;
  disabled?: boolean;
  onClick: () => void;
  /**
   * `default` is the square outlined button on a card or page surface;
   * `overlay` is the round translucent one over a photo or video.
   */
  variant?: "default" | "overlay";
  className?: string;
}

/**
 * The previous/next stepper used by every pager: months on the calendar,
 * weeks on the daily report, photos in the media viewer. One shape and one
 * chevron everywhere, so a parent learns it once.
 */
export default function StepButton({
  direction,
  label,
  disabled = false,
  onClick,
  variant = "default",
  className,
}: StepButtonProps) {
  const Chevron = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
        variant === "overlay"
          ? "pointer-events-auto h-11 w-11 rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm disabled:opacity-35"
          : "h-8 w-8 rounded-lg border border-input bg-card text-foreground hover:bg-muted disabled:opacity-40",
        className,
      )}
    >
      <Chevron
        className={variant === "overlay" ? "h-5 w-5" : "h-4 w-4"}
        aria-hidden
      />
    </button>
  );
}
