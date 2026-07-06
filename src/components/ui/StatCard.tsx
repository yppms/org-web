import { ReactNode } from "react";

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

// Full class strings so Tailwind's JIT can see them (no dynamic construction).
const toneClass: Record<StatTone, { card: string; value: string }> = {
  primary: {
    card: "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20",
    value: "text-primary",
  },
  error: {
    card: "bg-gradient-to-br from-error/10 to-error/5 border border-error/20",
    value: "text-error",
  },
  warning: {
    card: "bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20",
    value: "text-warning",
  },
  info: {
    card: "bg-gradient-to-br from-info/10 to-info/5 border border-info/20",
    value: "text-info",
  },
  neutral: {
    card: "bg-base-100 border border-base-300",
    value: "text-base-content",
  },
};

/**
 * Gradient stat/summary card. Replaces the per-color hardcoded stat cards in
 * the admin sections — pick a `tone` by MEANING (primary=positive/money,
 * error=outstanding, warning=pending, info=informational) and the colors come
 * from the theme, so the whole app re-themes together.
 */
export default function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: StatCardProps) {
  const t = toneClass[tone];
  return (
    <div className={`card ${t.card}`}>
      <div className="card-body p-4">
        <div className="text-xs text-base-content/60">{label}</div>
        <div className={`text-xl font-bold ${t.value}`}>{value}</div>
        {hint && <div className="text-xs text-base-content/50 mt-1">{hint}</div>}
      </div>
    </div>
  );
}
