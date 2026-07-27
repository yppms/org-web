"use client";

import { useEffect, useState } from "react";
import kindyStudentApi from "@/lib/api";
import {
  HarianDay,
  HarianMedia,
  Infaq,
  Invoice,
  KindyStudent,
  Payment,
  Saving,
  StudentStats,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { relativeDayLabel, weekdayName } from "@/lib/harian";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import ActivityRow from "./ActivityRow";
import ReportEntries from "./harian/ReportEntries";
import type { StudentSection } from "./Navigation";

interface HomeSectionProps {
  profile: KindyStudent;
  stats: StudentStats;
  onNavigate: (section: StudentSection) => void;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}

/**
 * One activity row's worth of data, whatever type it came from.
 *
 * The row is titled by its `type` — this card shows the newest of each kind,
 * so "Tagihan" / "Pembayaran" is what distinguishes one row from the next.
 * The individual record's `name` belongs in the subline beside its date.
 */
interface LatestActivity {
  key: string;
  /** Section this came from: "Tagihan", "Pembayaran", "Tabungan", "Infaq". */
  type: string;
  /** The specific record, e.g. an invoice name. Null when it has no name. */
  name: string | null;
  date: string;
  amount: string;
  badge: string;
  badgeVariant: BadgeProps["variant"];
}

/** "regular-jul-26-prorate · 13-Jul-26", or just the date when unnamed. */
const detailOf = (row: LatestActivity): string =>
  row.name && row.name !== row.type ? `${row.name} · ${row.date}` : row.date;

/**
 * What a payment paid off. One payment can be split across several invoices
 * (and partly from savings), so the extra ones are counted rather than listed
 * — the full breakdown lives in the Keuangan tab.
 */
const invoicesPaidBy = (payment: Payment): string | null => {
  const names = payment.appliedInvoices?.length
    ? payment.appliedInvoices.map((applied) => applied.invoiceName)
    : payment.invoiceName
      ? [payment.invoiceName]
      : [];
  if (names.length === 0) return null;
  return names.length === 1
    ? names[0]
    : `${names[0]} +${names.length - 1} lagi`;
};

const INVOICE_STATUS: Record<
  string,
  { text: string; variant: BadgeProps["variant"] }
> = {
  issued: { text: "Terbit", variant: "warning" },
  paid: { text: "Lunas", variant: "default" },
  partial: { text: "Sebagian", variant: "warning" },
  overdue: { text: "Terlambat", variant: "destructive" },
};

const SAVING_STATUS: Record<
  string,
  { text: string; variant: BadgeProps["variant"] }
> = {
  SUCCESS: { text: "Sukses", variant: "default" },
  REQUEST: { text: "Diproses", variant: "warning" },
  FAIL: { text: "Gagal", variant: "destructive" },
};

/** Newest first by the backend's running number. */
const newest = <T extends { no: number }>(rows: T[]): T | undefined =>
  [...rows].sort((a, b) => b.no - a.no)[0];

/**
 * Beranda — the landing tab. Composes a summary of every other tab: what is
 * owed, the latest daily report, recent money movement, and the full-day
 * programme.
 *
 * Card order is driven by urgency rather than a fixed layout: an overdue bill
 * jumps to the top, and when nothing is overdue the bill sinks below the
 * report, because on a normal day the thing a parent opens this for is what
 * their child did today.
 */
export default function HomeSection({
  profile,
  stats,
  onNavigate,
  onOpenMedia,
}: HomeSectionProps) {
  const [activity, setActivity] = useState<LatestActivity[] | null>(null);
  const [latestDay, setLatestDay] = useState<HarianDay | null>(null);
  const [harianLoading, setHarianLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Each card degrades on its own — one failing endpoint shouldn't blank the
    // whole landing screen.
    Promise.all([
      kindyStudentApi.getInvoices().catch(() => null),
      kindyStudentApi.getPayments().catch(() => null),
      kindyStudentApi.getSavings().catch(() => null),
      kindyStudentApi.getInfaq().catch(() => null),
    ]).then(([invoices, payments, savings, infaq]) => {
      if (cancelled) return;

      const rows: LatestActivity[] = [];

      const invoice = newest<Invoice>(invoices?.data ?? []);
      if (invoice) {
        const status = INVOICE_STATUS[invoice.status] ?? {
          text: invoice.status,
          variant: "secondary" as const,
        };
        rows.push({
          key: `invoice-${invoice.id}`,
          type: "Tagihan",
          name: invoice.name,
          date: formatDate(invoice.startDate),
          amount: formatCurrency(invoice.amount),
          badge: status.text,
          badgeVariant: status.variant,
        });
      }

      const payment = newest<Payment>(payments?.data ?? []);
      if (payment) {
        rows.push({
          key: `payment-${payment.id}`,
          type: "Pembayaran",
          // Both the bank reference and what it settled — they answer
          // different questions ("which transfer was this?" vs "what did it
          // pay?"). detailOf appends the date after them.
          name:
            [payment.reference, invoicesPaidBy(payment)]
              .filter(Boolean)
              .join(" · ") || null,
          date: formatDate(payment.date),
          amount: formatCurrency(payment.amount),
          badge: "Sukses",
          badgeVariant: "default",
        });
      }

      const saving = newest<Saving>(savings?.data ?? []);
      if (saving) {
        const status = SAVING_STATUS[saving.status] ?? {
          text: saving.status,
          variant: "secondary" as const,
        };
        const isWithdraw = saving.type === "WITHDRAW";
        rows.push({
          key: `saving-${saving.id}`,
          type: "Tabungan",
          name: isWithdraw ? "Narik" : "Nabung",
          date: formatDate(saving.date),
          amount: `${isWithdraw ? "−" : ""}${formatCurrency(saving.amount)}`,
          badge: status.text,
          badgeVariant: status.variant,
        });
      }

      const donation = newest<Infaq>(infaq?.data ?? []);
      if (donation) {
        rows.push({
          key: `infaq-${donation.id}`,
          type: "Infaq",
          name: donation.reference || null,
          date: formatDate(donation.date),
          amount: formatCurrency(donation.amount),
          badge: "Sukses",
          badgeVariant: "default",
        });
      }

      setActivity(rows);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    kindyStudentApi
      .getHarianIndex()
      .then((response) => {
        const newestDate = response.data?.[0]?.date;
        if (!newestDate) return null;
        return kindyStudentApi
          .getHarianDay(newestDate)
          .then((day) => day.data ?? null);
      })
      .catch(() => null)
      .then((day) => {
        if (cancelled) return;
        setLatestDay(day ?? null);
        setHarianLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const outstandingRows = stats.outstandingInvoice ?? [];
  const isLunas = stats.outstanding <= 0;
  const hasOverdue = outstandingRows.some((row) => row.daysLate > 0);

  const isFullDayEnrolled = profile.KindyStudentRecurringFee?.some((fee) =>
    fee.KindyRecurringFee.name.toLowerCase().includes("full day"),
  );

  return (
    <div className="flex flex-col gap-4">
      {!isLunas && (
        <Card style={{ order: hasOverdue ? 0 : 10 }}>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border">
            <CardTitle>Tagihan</CardTitle>
            <CardLink
              label="Lihat & bayar"
              onClick={() => onNavigate("keuangan")}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-3">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span
                className="font-mono text-2xl font-bold tracking-[-0.02em]"
                suppressHydrationWarning
              >
                {formatCurrency(Math.max(0, stats.outstanding))}
              </span>
              <Badge variant={hasOverdue ? "destructive" : "warning"}>
                {hasOverdue
                  ? "Terlambat"
                  : `${outstandingRows.length || stats.countInvoice} tagihan`}
              </Badge>
            </div>

            {/* Same three columns as the Keuangan tab's table, so the summary
                and the full list read identically. */}
            {outstandingRows.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-t-0">
                    <TableHead>Tagihan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Terakhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingRows.map((invoice, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {invoice.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(invoice.outstanding)}
                      </TableCell>
                      {invoice.daysLate > 0 ? (
                        <TableCell className="text-right font-semibold text-destructive">
                          Terlambat {invoice.daysLate} hari
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card style={{ order: 1 }}>
        <CardHeader className="flex-row items-baseline justify-between gap-3 border-b border-border">
          <CardTitle>Harian</CardTitle>
          <CardLink label="Lihat semua" onClick={() => onNavigate("harian")} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5 pt-4">
          {harianLoading ? (
            <Spinner />
          ) : latestDay ? (
            <>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {relativeDayLabel(latestDay.date)}
                </span>{" "}
                · {weekdayName(latestDay.date)}{" "}
                <span className="font-mono">{formatDate(latestDay.date)}</span>
              </span>
              <ReportEntries day={latestDay} onOpenMedia={onOpenMedia} />
            </>
          ) : (
            <EmptyState message="Belum ada laporan harian." />
          )}
        </CardContent>
      </Card>

      <Card style={{ order: 2 }}>
        <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border">
          <CardTitle>Keuangan</CardTitle>
          <CardLink
            label="Lihat semua"
            onClick={() => onNavigate("keuangan")}
          />
        </CardHeader>
        <CardContent className="px-5 pb-2 pt-0">
          {activity === null ? (
            <Spinner />
          ) : activity.length === 0 ? (
            <EmptyState message="Belum ada aktivitas." />
          ) : (
            activity.map((row) => (
              <ActivityRow
                key={row.key}
                title={row.type}
                sub={detailOf(row)}
                amount={row.amount}
                badge={row.badge}
                badgeVariant={row.badgeVariant}
              />
            ))
          )}
        </CardContent>
      </Card>

      {isFullDayEnrolled && (
        <Card style={{ order: 3 }}>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border">
            <CardTitle>Program Full Day</CardTitle>
            <CardLink label="Kelola" onClick={() => onNavigate("profile")} />
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-3">
            <Badge>Aktif</Badge>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Ananda mengikuti program full day.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** The muted "Lihat semua ›" affordance every Beranda card header carries. */
function CardLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label} ›
    </button>
  );
}
