import { ReactNode } from "react";
import { Badge } from "./badge";

interface SectionHeaderProps {
  title: ReactNode;
  /** Optional count shown in an outline badge, e.g. 5. */
  count?: number;
  /** Label appended after the count, e.g. "infaq" → "5 infaq". */
  countLabel?: string;
  /** Optional trailing content (buttons, filters) rendered on the right. */
  actions?: ReactNode;
}

/**
 * Standard section heading — title (18/600) + optional count badge + actions.
 */
export default function SectionHeader({
  title,
  count,
  countLabel,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <Badge variant="outline" className="rounded-full">
            {count}
            {countLabel ? ` ${countLabel}` : ""}
          </Badge>
        )}
        {actions}
      </div>
    </div>
  );
}
