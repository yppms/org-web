import { ReactNode } from "react";

interface EmptyStateProps {
  /** Defaults to the Indonesian "Tidak ada data". */
  message?: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
}

/**
 * "No data" placeholder. A muted, centered block.
 */
export default function EmptyState({
  message = "Tidak ada data",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-muted px-4 py-10 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-[13px] text-muted-foreground">{message}</p>
    </div>
  );
}
