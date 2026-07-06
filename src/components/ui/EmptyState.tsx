import { ReactNode } from "react";

interface EmptyStateProps {
  /** Defaults to the Indonesian "Tidak ada data". */
  message?: ReactNode;
  /** Optional leading icon/emoji. */
  icon?: ReactNode;
}

/**
 * "No data" placeholder card. Replaces the divergent empty-state blocks.
 */
export default function EmptyState({
  message = "Tidak ada data",
  icon,
}: EmptyStateProps) {
  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center">
        {icon && <div className="text-2xl">{icon}</div>}
        <p className="text-base-content/70">{message}</p>
      </div>
    </div>
  );
}
