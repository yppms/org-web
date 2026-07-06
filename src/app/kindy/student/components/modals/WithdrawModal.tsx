"use client";

import { formatCurrency, formatRupiah } from "@/lib/utils";

interface WithdrawModalProps {
  balance: number;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetAmount: (value: string) => void;
  isSubmitting: boolean;
  success: string | null;
  onWithdraw: () => void;
  onClose: () => void;
}

const closeDialog = () => {
  (document.getElementById("withdraw_modal") as HTMLDialogElement | null)?.close();
};

/**
 * Savings withdrawal request. Opened via
 * document.getElementById("withdraw_modal").showModal().
 */
export default function WithdrawModal({
  balance,
  amount,
  onAmountChange,
  onSetAmount,
  isSubmitting,
  success,
  onWithdraw,
  onClose,
}: WithdrawModalProps) {
  const handleClose = () => {
    closeDialog();
    onClose();
  };

  return (
    <dialog id="withdraw_modal" className="modal">
      <div className="modal-box w-full max-w-sm mx-2">
        {success ? (
          <div className="text-center py-8">
            <h3 className="font-bold text-lg text-success mb-4">
              Permintaan penarikan berhasil dikirim
            </h3>
            <p className="text-base-content/70 mb-6">{success}</p>
            <button
              className="btn btn-success"
              onClick={() => {
                closeDialog();
                onClose();
              }}
            >
              Selesai
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg">Tarik Tabungan</h3>
            <div className="py-4">
              <div className="mb-4">
                <p className="text-base-content/70 mb-2">
                  Saldo tersedia:{" "}
                  <span className="font-semibold text-success">{formatCurrency(balance)}</span>
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-sm font-medium py-2">Jumlah penarikan</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="contoh: 50000"
                  value={formatRupiah(amount)}
                  onChange={onAmountChange}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onSetAmount(Math.floor(balance / 4).toString())}
                  disabled={balance <= 0}
                >
                  25%
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onSetAmount(Math.floor(balance / 2).toString())}
                  disabled={balance <= 0}
                >
                  50%
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onSetAmount(balance.toString())}
                  disabled={balance <= 0}
                >
                  Semua
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={handleClose} disabled={isSubmitting}>
                Keluar
              </button>
              <button
                className="btn btn-primary"
                onClick={onWithdraw}
                disabled={isSubmitting || !amount}
              >
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                Tarik sekarang
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>keluar</button>
      </form>
    </dialog>
  );
}
