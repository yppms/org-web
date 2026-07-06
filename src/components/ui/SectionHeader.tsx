import { ReactNode } from "react";

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
 * Standard section heading. Standardises the section-header typography to the
 * `heading` role (text-lg font-bold) so the previous font-bold/font-semibold
 * split can't recur. Replaces the hand-written <h2> + badge in every section.
 */
export default function SectionHeader({
  title,
  count,
  countLabel,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="badge badge-outline text-base-content text-xs rounded-full">
            {count}
            {countLabel ? ` ${countLabel}` : ""}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
