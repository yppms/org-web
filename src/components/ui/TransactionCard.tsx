import { ReactNode } from "react";

interface TransactionCardProps {
  /** Left/right content of the top strip (bg-base-200/30, border-b). */
  header?: ReactNode;
  /** Left/right content of the bottom strip (bg-base-200/30, border-t). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The transaction/list card shell: header strip / body / footer strip.
 * Replaces the copy-pasted `card bg-base-100 border-2` markup across the
 * student list sections. Pass any nodes for header/footer; they sit in the
 * standard `flex justify-between` strips.
 */
export default function TransactionCard({
  header,
  footer,
  children,
  className = "",
}: TransactionCardProps) {
  return (
    <div className={`card bg-base-100 border-2 ${className}`}>
      <div className="card-body p-0">
        {header !== undefined && (
          <div className="flex justify-between items-center px-4 py-3 bg-base-200/30 border-b-2 border-base-300/50 text-xs">
            {header}
          </div>
        )}
        <div className="space-y-3 px-4 py-3">{children}</div>
        {footer !== undefined && (
          <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
