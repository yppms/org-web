"use client";

import { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState } from "@/components/ui";
import ActivityRow from "./ActivityRow";

export default function PaymentSection() {
  const { data, isLoading, error } = useApi<Payment[]>(
    () => kindyStudentApi.getPayments(),
    { fallbackMessage: "Gagal memuat pembayaran" },
  );
  const payments = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;
  if (payments.length === 0)
    return <EmptyState message="Belum ada riwayat pembayaran" />;

  return (
    <div>
      {payments
        .sort((a, b) => b.no - a.no)
        .map((payment) => {
          const applied = payment.appliedInvoices ?? [];
          const hasSaving = !!(
            payment.savingsAmount && payment.savingsAmount > 0
          );
          const allocations = [
            ...applied.map((inv) => ({
              name: inv.invoiceName,
              amount: inv.amount,
            })),
            ...(hasSaving
              ? [
                  {
                    name: "Saldo tabungan",
                    amount: payment.savingsAmount as number,
                  },
                ]
              : []),
          ];

          const extra =
            allocations.length > 0 ? (
              <div className="rounded-lg bg-muted px-3 py-1">
                {allocations.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {a.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs">
                      {formatCurrency(a.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : undefined;

          return (
            <ActivityRow
              key={payment.id}
              title={`Bayar #${payment.no}`}
              date={formatDate(payment.date)}
              sub={payment.reference ?? undefined}
              amount={formatCurrency(payment.amount)}
              badge="Sukses"
              badgeVariant="default"
              extra={extra}
            />
          );
        })}
    </div>
  );
}
