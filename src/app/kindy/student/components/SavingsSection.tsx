"use client";

import { Saving, StudentStats } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  SectionHeader,
  TransactionCard,
  AmountBadge,
} from "@/components/ui";

interface SavingsSectionProps {
  stats: StudentStats;
  onStatsUpdate: (stats: StudentStats) => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS")
    return <span className="text-xs font-semibold text-success">✓ Sukses</span>;
  if (status === "REQUEST")
    return <span className="text-xs font-semibold text-warning">⏳ Request</span>;
  return <span className="text-xs font-semibold text-error">✗ Gagal</span>;
}

export default function SavingsSection(_props: SavingsSectionProps) {
  const { data, isLoading, error } = useApi<Saving[]>(
    () => kindyStudentApi.getSavings(),
    { fallbackMessage: "Gagal memuat tabungan" }
  );
  const savings = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Tabungan" count={savings.length} countLabel="transaksi" />

      {savings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {savings
            .sort((a, b) => b.no - a.no)
            .map((saving) => (
              <TransactionCard
                key={saving.id}
                header={
                  <>
                    <span className="font-medium text-base-content/60">{saving.no}</span>
                    <span className="font-medium text-base-content/60">
                      {formatDate(saving.date)}
                    </span>
                  </>
                }
                footer={
                  <>
                    <span className="text-xs text-base-content/50">
                      #{saving.id.toString().toUpperCase()}
                    </span>
                    <div className="flex gap-2 items-center">
                      {saving.reference && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full italic text-base-content">
                          {saving.reference}
                        </span>
                      )}
                      <StatusBadge status={saving.status} />
                    </div>
                  </>
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {saving.type === "SAVE" ? `nabung-${formatDate(saving.date)}` : "tarik"}
                  </span>
                  <span>{saving.type === "SAVE" ? "💰" : "💸"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60 font-medium">Jumlah</span>
                  <AmountBadge>{formatCurrency(saving.amount)}</AmountBadge>
                </div>
              </TransactionCard>
            ))}
        </div>
      )}
    </div>
  );
}
