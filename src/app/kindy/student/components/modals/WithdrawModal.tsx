"use client";

import { Info, Loader2 } from "lucide-react";
import { WithdrawQuota } from "@/lib/types";
import { formatCurrency, formatDate, formatRupiah } from "@/lib/utils";
import { Modal, Button, Input, Label, Separator } from "@/components/ui";

interface WithdrawModalProps {
  open: boolean;
  balance: number;
  /** The prorata-to-graduation cap; absent only while stats are stale. */
  quota?: WithdrawQuota;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetAmount: (value: string) => void;
  isSubmitting: boolean;
  success: string | null;
  onWithdraw: () => void;
  onClose: () => void;
}

/** One label/value line of the breakdown. */
function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="min-w-0 text-muted-foreground">{label}</span>
      <span
        className={`shrink-0 font-mono ${
          strong ? "font-semibold text-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function WithdrawModal({
  open,
  balance,
  quota,
  amount,
  onAmountChange,
  onSetAmount,
  isSubmitting,
  success,
  onWithdraw,
  onClose,
}: WithdrawModalProps) {
  // Without the quota (stale stats) fall back to the balance, as before; the
  // server still enforces the cap.
  const available = quota ? quota.available : balance;
  const fee = quota?.fee ?? 0;
  // One decimal, Indonesian comma — our own number, not a formatter's output.
  const pct = quota ? (quota.progress * 100).toFixed(1).replace(".", ",") : "";
  const amountNum = Number(amount) || 0;
  // What the quota alone allows; `available` is this unless the balance
  // cannot cover it.
  const headroom = quota ? Math.max(0, quota.quota - quota.withdrawn) : balance;
  // The fee rides on top of the amount, so the most one can ask for also
  // leaves the fee in the balance, and nothing can be asked for at all until
  // the allowance covers the fee.
  const max = Math.max(0, Math.min(available, balance - fee));
  const formOpen = available >= fee && max >= fee;
  const tooSmall = amountNum > 0 && amountNum < fee;
  const tooLarge = amountNum > max;
  const canSubmit = formOpen && amountNum > 0 && !tooSmall && !tooLarge;
  // The breakdown rows, in the invoice list's style.
  // `strong` marks the result line: bold label, larger bold value, rule above.
  const calcRows: {
    label: string;
    value: string;
    className?: string;
    strong?: boolean;
  }[] = [];
  if (quota) {
    calcRows.push({
      label: "Total menabung (akumulasi)",
      value: formatCurrency(quota.totalSave),
    });
    calcRows.push({
      label: `Masa berjalan ${pct}% × Total menabung`,
      value: formatCurrency(quota.quota),
    });
    if (quota.withdrawn > 0) {
      calcRows.push({
        label: "Total menarik (akumulasi)",
        value: `−${formatCurrency(quota.withdrawn)}`,
        className: "text-warning",
      });
    }
    calcRows.push({
      label: "Bisa ditarik hari ini",
      value: formatCurrency(headroom),
      className: "text-primary",
      strong: true,
    });
    if (available < headroom) {
      calcRows.push({
        label: "Dibatasi saldo",
        value: formatCurrency(available),
        className: "text-destructive",
        strong: true,
      });
    }
  }
  // Quick picks snap to whole thousands.
  const pick = (share: number) =>
    (Math.floor((max * share) / 1000) * 1000).toString();

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={!isSubmitting}
      title={success ? undefined : "Tarik Tabungan"}
      actions={
        success ? (
          <Button size="sm" onClick={onClose}>
            Selesai
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={onWithdraw}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Tarik sekarang
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
            ✓
          </div>
          <h3 className="mb-2 text-base font-semibold">
            Permintaan penarikan terkirim
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {success}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 1. The balance, and how today's allowance follows from it. */}
          <div>
            <p className="text-[13px] text-muted-foreground">Saldo</p>
            <p className="font-mono text-2xl font-bold tracking-[-0.02em]">
              {formatCurrency(balance)}
            </p>
            {quota && (
              <div className="mt-3 flex flex-col gap-1.5">
                {quota.startDate && quota.graduationDate && (
                  <Line
                    label="Periode menabung"
                    value={`${formatDate(quota.startDate)} s.d. ${formatDate(
                      quota.graduationDate,
                    )}`}
                  />
                )}
                <div className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="min-w-0 text-muted-foreground">
                    Masa berjalan
                  </span>
                  <span className="shrink-0 font-mono text-foreground">
                    {quota.daysElapsed} dari {quota.daysTotal} hari ={" "}
                    <strong className="font-semibold">{pct}%</strong>
                  </span>
                </div>
                {/* The calculation, laid out like an invoice's breakdown. */}
                <div className="mt-1.5 rounded-lg bg-muted px-3 py-1">
                  {calcRows.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 py-1 ${
                        r.strong ? "mt-1 border-t border-border pt-2" : ""
                      }`}
                    >
                      <span
                        className={
                          r.strong
                            ? "text-[13px] font-semibold text-foreground"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {r.label}
                      </span>
                      <span
                        className={`font-mono ${
                          r.strong ? "text-sm font-bold" : "text-xs"
                        } ${r.className ?? ""}`}
                      >
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Why the cap exists — the same info box as the Harian disclaimer. */}
          <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info-soft px-3.5 py-3">
            <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-info/15 text-info">
              <Info className="h-3.5 w-3.5" />
            </span>
            <p className="prose min-w-0 text-[11px] leading-relaxed text-muted-foreground">
              Program tabungan mengasah aspek emosional Ananda lewat{" "}
              <em>delayed gratification</em>, penarikan tabungan oleh wali
              santri dibuka bertahap mengikuti masa sekolah. Pembatasan
              berdasarkan konsep <em>commitment device</em> (Ashraf, Karlan
              &amp; Yin, 2006) dan <em>earmarking</em> (Soman &amp; Cheema,
              2011).
            </p>
          </div>

          <Separator />

          {/* 3. The amount. */}
          <div className="flex flex-col gap-1.5">
            <Label>Jumlah penarikan</Label>
            <Input
              type="text"
              placeholder="Rp50.000"
              value={formatRupiah(amount)}
              onChange={onAmountChange}
              className="font-mono"
              disabled={!formOpen}
            />
            <div className="mt-1 flex gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onSetAmount(pick(0.25))}
                disabled={!formOpen}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => onSetAmount(pick(0.5))}
                disabled={!formOpen}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => onSetAmount(max.toString())}
                disabled={!formOpen}
              >
                Maks
              </Button>
            </div>
          </div>

          {/* 4. What leaves the savings. */}
          <div className="flex flex-col gap-1.5">
            <Line label="Jumlah ditarik" value={formatCurrency(amountNum)} />
            <Line label="Biaya admin" value={formatCurrency(fee)} />
            <Line
              label="Total penarikan"
              value={formatCurrency(amountNum + fee)}
              strong
            />
            {!formOpen ? (
              <p className="text-[12px] text-muted-foreground">
                Jatah hari ini belum menutup biaya admin{" "}
                <span className="font-mono text-foreground">
                  {formatCurrency(fee)}
                </span>
                .
              </p>
            ) : tooSmall ? (
              <p className="text-[12px] text-muted-foreground">
                Penarikan minimal{" "}
                <span className="font-mono text-foreground">
                  {formatCurrency(fee)}
                </span>{" "}
                agar menutup biaya admin.
              </p>
            ) : tooLarge ? (
              <p className="text-[12px] text-muted-foreground">
                Maksimal{" "}
                <span className="font-mono text-foreground">
                  {formatCurrency(max)}
                </span>{" "}
                termasuk menyisakan biaya admin di saldo.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}
