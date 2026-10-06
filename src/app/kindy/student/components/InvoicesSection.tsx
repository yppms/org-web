"use client";

import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState } from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import ActivityRow from "./ActivityRow";
import RichText from "@/components/RichText";

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
          // A refund on this bill: its original figures stay above, then what
          // was paid, the school's share (hak sekolah) and the difference.
          const refundRows: typeof rows = [];
          if (invoice.refund) {
            const { totalPaid, schoolShare, refundable } = invoice.refund;
            rows.push({ label: "Terbayar", value: formatCurrency(totalPaid) });
            refundRows.push({
              label: "Total biaya realisasi",
              value: formatCurrency(-schoolShare),
              // Same as the other deduction above (Dibayar Ponpes).
              className: "text-warning",
            });
            refundRows.push({
              label: refundable < 0 ? "Kurang bayar" : "Dikembalikan",
              value: formatCurrency(Math.abs(refundable)),
              className:
                refundable < 0
                  ? "text-destructive"
                  : "font-semibold text-primary",
            });
          }
          // Only when partially paid: some payment made, but still outstanding.
          // A refund's own breakdown already says what is left.
          if (!invoice.refund && invoice.paid > 0 && invoice.outstanding > 0) {
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

          const renderRows = (list: typeof rows) =>
            list.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 py-1"
              >
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className={`font-mono text-xs ${r.className ?? ""}`}>
                  {r.value}
                </span>
              </div>
            ));

          const extra =
            rows.length > 0 || invoice.refund || invoice.refundedIn ? (
              <div className="rounded-lg bg-muted px-3 py-1">
                {renderRows(rows)}
                {invoice.refund && (
                  <>
                    <div className="mt-1 border-t border-border pb-1 pt-2 text-xs font-medium">
                      Kebijakan refund
                    </div>
                    {invoice.refund.description && (
                      <RichText
                        html={invoice.refund.description}
                        className="py-1 text-xs text-muted-foreground"
                      />
                    )}
                    {renderRows(refundRows)}
                  </>
                )}
                {invoice.refundedIn && (
                  <p className="py-1 text-xs text-muted-foreground">
                    Diselesaikan lewat refund di {invoice.refundedIn}
                  </p>
                )}
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
              // Marks the bill a refund sits on, and any other it replaced.
              tag={invoice.refund || invoice.refundedIn ? "Refund" : undefined}
              extra={extra}
            />
          );
        })}
    </div>
  );
}
