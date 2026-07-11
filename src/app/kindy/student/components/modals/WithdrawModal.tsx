"use client";

import { Loader2 } from "lucide-react";
import { formatCurrency, formatRupiah } from "@/lib/utils";
import { Modal, Button, Input, Label } from "@/components/ui";

interface WithdrawModalProps {
  open: boolean;
  balance: number;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetAmount: (value: string) => void;
  isSubmitting: boolean;
  success: string | null;
  onWithdraw: () => void;
  onClose: () => void;
}

export default function WithdrawModal({
  open,
  balance,
  amount,
  onAmountChange,
  onSetAmount,
  isSubmitting,
  success,
  onWithdraw,
  onClose,
}: WithdrawModalProps) {
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
              disabled={isSubmitting || !amount}
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
        <>
          <p className="mb-4 text-[13px] text-muted-foreground">
            Saldo tersedia{" "}
            <strong className="font-mono text-foreground">
              {formatCurrency(balance)}
            </strong>
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>Jumlah penarikan</Label>
            <Input
              type="text"
              placeholder="Rp50.000"
              value={formatRupiah(amount)}
              onChange={onAmountChange}
              className="font-mono"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSetAmount(Math.floor(balance / 4).toString())}
              disabled={balance <= 0}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSetAmount(Math.floor(balance / 2).toString())}
              disabled={balance <= 0}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSetAmount(balance.toString())}
              disabled={balance <= 0}
            >
              Semua
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
