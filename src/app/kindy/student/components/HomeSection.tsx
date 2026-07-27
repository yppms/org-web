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
import { weekdayName } from "@/lib/harian";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
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

/** One activity row's worth of data, whatever type it came from. */
interface LatestActivity {
  key: string;
  title: string;
  type: string;
  date: string;
  amount: string;
  badge: string;
  badgeVariant: BadgeProps["variant"];
}

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
          title: invoice.name,
          type: "Tagihan",
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
          title: payment.invoiceName || payment.reference || "Pembayaran",
          type: "Pembayaran",
          date: formatDate(payment.date),
          amount: formatCurrency(payment.amount),
          badge: "Diterima",
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
          title: isWithdraw ? "Narik" : "Nabung",
          type: "Tabungan",
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
          title: donation.reference || "Infaq",
          type: "Infaq",
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

            {outstandingRows.length > 0 && (
              <div>
                {outstandingRows.map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 border-t border-border py-2.5 text-[13px]"
                  >
                    <span className="min-w-0 font-medium">{invoice.name}</span>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="font-mono">
                        {formatCurrency(invoice.outstanding)}
                      </span>
                      {invoice.daysLate > 0 ? (
                        <span className="font-semibold text-destructive">
                          Terlambat {invoice.daysLate} hari
                        </span>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                {weekdayName(latestDay.date)} ·{" "}
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
                title={row.title}
                sub={`${row.type} · ${row.date}`}
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
