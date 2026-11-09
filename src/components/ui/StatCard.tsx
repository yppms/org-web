import { CSSProperties, ReactNode } from "react";

/** Semantic tones only — maps to the theme's meaning-based tokens. */
export type StatTone = "primary" | "error" | "warning" | "info" | "neutral";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Small muted line under the value, e.g. "3 students". */
  hint?: ReactNode;
  /** Semantic tone. Defaults to a plain neutral card. */
  tone?: StatTone;
}

// Value text color per tone (card chrome is the same neutral card everywhere).
const valueClass: Record<StatTone, string> = {
  primary: "text-primary",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  neutral: "text-foreground",
};

/** `--stat-chars` for a `stat-value`: how many glyphs the figure has to fit. */
export const statChars = (value: ReactNode) =>
  ({
    "--stat-chars": typeof value === "string" ? value.length : 12,
  }) as CSSProperties;

/**
 * Stat/summary tile. Pick a `tone` by MEANING (primary=positive/money,
 * error=outstanding, warning=pending, info=informational) — the value color
 * comes from the theme so the whole app re-themes together.
 *
 * The value is sized from the tile's own width and the value's length
 * (`stat-box` / `stat-value` in globals.css), so "Rp100.000.000" still fits a
 * half-width tile on a 320px phone. That needs the tile's width to come from
 * its parent (a grid cell, a block) — not from its content.
 */
export default function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div className="stat-box rounded-xl border border-border bg-card px-4 py-3.5 shadow-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`stat-value mt-1 font-mono font-bold tracking-[-0.02em] ${valueClass[tone]}`}
        style={statChars(value)}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
