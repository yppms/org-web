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
      {savings
        .sort((a, b) => b.no - a.no)
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
              amount={`${isWithdraw ? "−" : ""}${formatCurrency(saving.amount)}`}
              badge={status.text}
              badgeVariant={status.variant}
            />
          );
        })}
    </div>
  );
}
