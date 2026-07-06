"use client";

import { Payment } from "@/lib/types";
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

export default function PaymentSection() {
  const { data, isLoading, error } = useApi<Payment[]>(
    () => kindyStudentApi.getPayments(),
    { fallbackMessage: "Gagal memuat pembayaran" },
  );
  const payments = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pembayaran"
        count={payments.length}
        countLabel="pembayaran"
      />

      {payments.length === 0 ? (
        <EmptyState message="Belum ada riwayat pembayaran" />
      ) : (
        <div className="space-y-4">
          {payments
            .sort((a, b) => b.no - a.no)
            .map((payment) => (
              <TransactionCard
                key={payment.id}
                header={
                  <>
                    <span className="font-medium text-base-content/60">
                      {payment.no}
                    </span>
                    <span className="font-medium text-base-content/60">
                      {formatDate(payment.date)}
                    </span>
                  </>
                }
                footer={
                  <>
                    <span className="text-xs text-base-content/50">
                      #{payment.id.toString().toUpperCase()}
                    </span>
                    <div className="flex gap-2 items-center">
                      {payment.reference && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full italic text-base-content">
                          {payment.reference}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-success">
                        ✓ Sukses
                      </span>
                    </div>
                  </>
                }
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    pembayaran-{payment.no}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60 font-medium">
                    Jumlah
                  </span>
                  <AmountBadge>{formatCurrency(payment.amount)}</AmountBadge>
                </div>
                {/* Which invoice(s) this payment was used for */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-base-content/60 font-medium">
                    Untuk membayar
                  </span>
                  {payment.appliedInvoices &&
                  payment.appliedInvoices.length > 0 ? (
                    <div className="space-y-1">
                      {payment.appliedInvoices.map((inv) => (
                        <div
                          key={inv.invoiceId}
                          className="flex justify-between items-center gap-2"
                        >
                          <span className="badge badge-primary badge-sm font-medium gap-1">
                            📋 {inv.invoiceName}
                          </span>
                          <span className="text-xs font-semibold text-base-content/70">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {payment.savingsAmount && payment.savingsAmount > 0 ? (
                    <div className="flex justify-between items-center gap-2">
                      <span className="badge badge-ghost badge-sm font-medium gap-1">
                        💰 Simpanan / saldo
                      </span>
                      <span className="text-xs font-semibold text-base-content/70">
                        {formatCurrency(payment.savingsAmount)}
                      </span>
                    </div>
                  ) : null}
                  {(!payment.appliedInvoices ||
                    payment.appliedInvoices.length === 0) &&
                    !(payment.savingsAmount && payment.savingsAmount > 0) && (
                      <span className="text-xs text-base-content/50 italic">
                        Belum dialokasikan
                      </span>
                    )}
                </div>
              </TransactionCard>
            ))}
        </div>
      )}
    </div>
  );
}
