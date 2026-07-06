"use client";

import { Infaq } from "@/lib/types";
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

export default function InfaqSection() {
  const { data, isLoading, error } = useApi<Infaq[]>(
    () => kindyStudentApi.getInfaq(),
    { fallbackMessage: "Gagal memuat data infaq" }
  );
  const infaq = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-3">
      <SectionHeader title="Infaq" count={infaq.length} countLabel="infaq" />

      {infaq.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {infaq
            .sort((a, b) => b.no - a.no)
            .map((item) => (
              <TransactionCard
                key={item.id}
                header={
                  <>
                    <span className="font-medium text-base-content/60">{item.no}</span>
                    <span className="font-medium text-base-content/60">
                      {formatDate(item.date)}
                    </span>
                  </>
                }
                footer={
                  <>
                    <span className="text-xs text-base-content/50">
                      #{item.id.toString().toUpperCase()}
                    </span>
                    <div className="flex gap-2 items-center">
                      {item.reference && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full italic text-base-content">
                          {item.reference}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-success">✓ Sukses</span>
                    </div>
                  </>
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">infaq-{formatDate(item.date)}</span>
                  <span className="text-lg">🤲</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60 font-medium">Jumlah</span>
                  <AmountBadge>{formatCurrency(item.amount)}</AmountBadge>
                </div>
              </TransactionCard>
            ))}
        </div>
      )}
    </div>
  );
}
