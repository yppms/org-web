"use client";

import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  SectionHeader,
  TransactionCard,
} from "@/components/ui";

const statusMap: Record<string, { icon: string; text: string; color: string }> = {
  issued: { icon: "⏳", text: "Terbit", color: "text-warning" },
  paid: { icon: "✓", text: "Lunas", color: "text-success" },
  partial: { icon: "◐", text: "Sebagian", color: "text-warning" },
  overdue: { icon: "⚠", text: "Terlambat", color: "text-error" },
};

function StatusBadge({ status }: { status: string }) {
  const info = statusMap[status] || { icon: "•", text: status, color: "text-base-content" };
  return (
    <span className={`text-xs font-semibold ${info.color}`}>
      {info.icon} {info.text}
    </span>
  );
}

export default function InvoicesSection() {
  const { data, isLoading, error } = useApi<Invoice[]>(
    () => kindyStudentApi.getInvoices(),
    { fallbackMessage: "Gagal memuat data tagihan" }
  );
  const invoices = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Tagihan" count={invoices.length} countLabel="tagihan" />

      {invoices.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {invoices
            .sort((a, b) => b.no - a.no)
            .map((invoice) => (
              <TransactionCard
                key={invoice.id}
                header={
                  <>
                    <span className="font-medium text-base-content/60">{invoice.no}</span>
                    <span className="font-medium text-base-content/60">
                      {formatDate(invoice.startDate)}
                    </span>
                  </>
                }
                footer={
                  <>
                    <span className="text-xs text-base-content/50">
                      #{invoice.id.toString().toUpperCase()}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </>
                }
              >
                <div className="font-bold text-base">{invoice.name}</div>
                <div className="space-y-2 text-xs">
                  {invoice.discount > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Jumlah</span>
                        <span className="font-medium">{formatCurrency(invoice.amountFull)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Diskon</span>
                        <span className="font-medium text-warning">
                          {formatCurrency(invoice.discount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60 font-medium">Total</span>
                        <span className="font-bold underline decoration-2 underline-offset-4">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60 font-medium">Total</span>
                      <span className="font-bold underline decoration-2 underline-offset-4">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Terbayar</span>
                    <span className="font-semibold">{formatCurrency(invoice.paid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Belum Terbayar</span>
                    <span className="font-bold text-error">
                      {formatCurrency(invoice.outstanding)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60">Jatuh Tempo</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </TransactionCard>
            ))}
        </div>
      )}
    </div>
  );
}
