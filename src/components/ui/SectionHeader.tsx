import { ReactNode } from "react";
import { Badge } from "./badge";

interface SectionHeaderProps {
  title: ReactNode;
  /** Muted line under the title, e.g. "Saldo tunggakan pembayaran siswa". */
  subtitle?: ReactNode;
  /** Optional count shown in an outline badge, e.g. 5. */
  count?: number;
  /** Label appended after the count, e.g. "infaq" → "5 infaq". */
  countLabel?: string;
  /** Optional trailing content (buttons, filters) rendered on the right. */
  actions?: ReactNode;
}

/**
 * Standard section heading — title (18/600) + optional subtitle, count badge
 * and actions. Use this for every section heading so the portal stays uniform;
 * don't hand-roll an `<h2>`.
 */
export default function SectionHeader({
  title,
  subtitle,
  count,
  countLabel,
  actions,
}: SectionHeaderProps) {
  const hasTrailing = count !== undefined || !!actions;

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {hasTrailing && (
        <div className="flex shrink-0 items-center gap-2">
          {count !== undefined && (
            <Badge variant="outline" className="rounded-full">
              {count}
              {countLabel ? ` ${countLabel}` : ""}
            </Badge>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
