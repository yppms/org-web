"use client";

import { Saving, StudentStats } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState } from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import ActivityRow from "./ActivityRow";

interface SavingsSectionProps {
  stats: StudentStats;
  onStatsUpdate: (stats: StudentStats) => void;
}

const statusMap: Record<string, { text: string; variant: BadgeProps["variant"] }> = {
  SUCCESS: { text: "Sukses", variant: "default" },
  REQUEST: { text: "Diproses", variant: "warning" },
  FAIL: { text: "Gagal", variant: "destructive" },
};

export default function SavingsSection(_props: SavingsSectionProps) {
  const { data, isLoading, error } = useApi<Saving[]>(
    () => kindyStudentApi.getSavings(),
    { fallbackMessage: "Gagal memuat tabungan" }
  );
  const savings = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;
  if (savings.length === 0) return <EmptyState />;

  return (
    <div>
      {[...savings]
        // Most recent activity first. `no` is only the backend's row order,
        // which drifts from the real chronology once records are backfilled.
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            b.no - a.no,
        )
        .map((saving) => {
          const status = statusMap[saving.status] || {
            text: saving.status,
            variant: "secondary" as const,
          };
          const isWithdraw = saving.type === "WITHDRAW";
          return (
            <ActivityRow
              key={saving.id}
              title={isWithdraw ? "Narik" : "Nabung"}
              date={formatDate(saving.date)}
              // The bank transaction id of the transfer that drew on the
              // savings — it answers "which transfer was this?", the same
              // question the reference on a payment answers. Only a withdrawal
              // can have one: a SAVE is a book entry from the sync sheet and
              // never carries a reference. It can still be absent, so the row
              // has to read without it — a withdrawal the parent requested
              // themselves has no reference until an admin settles it.
              sub={isWithdraw ? (saving.reference ?? undefined) : undefined}
              amount={`${isWithdraw ? "−" : ""}${formatCurrency(saving.amount)}`}
              badge={status.text}
              badgeVariant={status.variant}
            />
          );
        })}
    </div>
  );
}
