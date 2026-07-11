import { ReactNode } from "react";

interface TransactionCardProps {
  /** Left/right content of the top strip (muted, border-b). */
  header?: ReactNode;
  /** Left/right content of the bottom strip (muted, border-t). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Transaction/list card shell: header strip / body / footer strip.
 */
export default function TransactionCard({
  header,
  footer,
  children,
  className = "",
}: TransactionCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card shadow-card ${className}`}
    >
      {header !== undefined && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-3 text-xs">
          {header}
        </div>
      )}
      <div className="space-y-3 px-4 py-3">{children}</div>
      {footer !== undefined && (
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/50 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
