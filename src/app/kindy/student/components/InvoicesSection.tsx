"use client";

import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState } from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import ActivityRow from "./ActivityRow";

const statusMap: Record<
  string,
  { text: string; variant: BadgeProps["variant"] }
> = {
  issued: { text: "Terbit", variant: "warning" },
  paid: { text: "Lunas", variant: "default" },
  partial: { text: "Sebagian", variant: "warning" },
  overdue: { text: "Terlambat", variant: "destructive" },
};

export default function InvoicesSection() {
  const { data, isLoading, error } = useApi<Invoice[]>(
    () => kindyStudentApi.getInvoices(),
    { fallbackMessage: "Gagal memuat data tagihan" },
  );
  const invoices = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;
  if (invoices.length === 0) return <EmptyState />;

  return (
    <div>
      {[...invoices]
        // Most recent activity first. `no` is only the backend's row order,
        // which drifts from the real chronology once records are backfilled.
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime() ||
            b.no - a.no,
        )
        .map((invoice) => {
          const status = statusMap[invoice.status] || {
            text: invoice.status,
            variant: "secondary" as const,
          };

          const rows: { label: string; value: string; className?: string }[] =
            [];
          if (invoice.discount > 0) {
            rows.push({
              label: "Total",
              value: formatCurrency(invoice.amountFull),
            });
            rows.push({
              label: "Dibayar Ponpes",
              value: `−${formatCurrency(invoice.discount)}`,
              className: "text-warning",
            });
          }
          // Only when partially paid: some payment made, but still outstanding.
          if (invoice.paid > 0 && invoice.outstanding > 0) {
            rows.push({
              label: "Terbayar",
              value: formatCurrency(invoice.paid),
            });
            rows.push({
              label: "Belum terbayar",
              value: formatCurrency(invoice.outstanding),
              className: "text-destructive",
            });
          }

          const extra =
            rows.length > 0 ? (
              <div className="rounded-lg bg-muted px-3 py-1">
                {rows.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="text-xs text-muted-foreground">
                      {r.label}
                    </span>
                    <span className={`font-mono text-xs ${r.className ?? ""}`}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : undefined;

          return (
            <ActivityRow
              key={invoice.id}
              title={invoice.name}
              date={formatDate(invoice.startDate)}
              amount={formatCurrency(invoice.amount)}
              badge={status.text}
              badgeVariant={status.variant}
              extra={extra}
            />
          );
        })}
    </div>
  );
}
