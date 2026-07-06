"use client";

import Image from "next/image";
import { formatRupiah } from "@/lib/utils";

type PaymentChoice = "receipt" | "no_receipt" | "";

interface PaymentConfirmModalProps {
  choice: PaymentChoice;
  onChoiceChange: (choice: PaymentChoice) => void;
  file: File | null;
  filePreview: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  date: string;
  onDateChange: (value: string) => void;
  amount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  finEnt: string;
  onFinEntChange: (value: string) => void;
  finNumName: string;
  onFinNumNameChange: (value: string) => void;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  onSubmitFile: () => void;
  onSubmitForm: () => void;
  onClose: () => void;
}

const closeDialog = () => {
  (document.getElementById("payment_confirm_modal") as HTMLDialogElement | null)?.close();
};

/**
 * Payment confirmation modal (receipt upload OR manual transfer details).
 * Opened via document.getElementById("payment_confirm_modal").showModal().
 */
export default function PaymentConfirmModal({
  choice,
  onChoiceChange,
  file,
  filePreview,
  onFileSelect,
  date,
  onDateChange,
  amount,
  onAmountChange,
  finEnt,
  onFinEntChange,
  finNumName,
  onFinNumNameChange,
  error,
  success,
  isSubmitting,
  onSubmitFile,
  onSubmitForm,
  onClose,
}: PaymentConfirmModalProps) {
  const handleClose = () => {
    closeDialog();
    onClose();
  };

  const submitDisabled =
    isSubmitting ||
    choice === "" ||
    (choice === "receipt" && !file) ||
    (choice === "no_receipt" &&
      (!date || !amount.trim() || !finEnt.trim() || !finNumName.trim()));

  return (
    <dialog id="payment_confirm_modal" className="modal">
      <div className="modal-box w-full max-w-sm mx-2">
        {success ? (
          <div className="text-center py-8">
            <h3 className="font-bold text-lg text-success mb-4">
              Konfirmasi pembayaran terkirim!
            </h3>
            <p className="text-base-content/70 mb-6">{success}</p>
            <button className="btn btn-success" onClick={handleClose}>
              Selesai
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg text-center">Konfirmasi Pembayaran</h3>

            <div className="py-4">
              {/* Radio Choice */}
              <div className="mb-6">
                <div className="text-3xl mb-4 text-center">📄</div>
                <p className="text-base-content/70 mb-4 text-center">
                  Apakah Anda memiliki screenshot atau dokumen transfer?
                </p>
                <div className="flex justify-center gap-10">
                  <div className="form-control">
                    <label className="label cursor-pointer flex-col gap-2">
                      <input
                        type="radio"
                        name="payment-choice"
                        className="radio radio-primary"
                        checked={choice === "no_receipt"}
                        onChange={() => onChoiceChange("no_receipt")}
                      />
                      <span className="label-text">Tidak</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer flex-col gap-2">
                      <input
                        type="radio"
                        name="payment-choice"
                        className="radio radio-primary"
                        checked={choice === "receipt"}
                        onChange={() => onChoiceChange("receipt")}
                      />
                      <span className="label-text">Punya</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              {choice === "receipt" && (
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text text-sm font-medium py-2">
                        Upload file screenshot atau dokumen transfer *
                      </span>
                    </label>
                    <input
                      type="file"
                      onChange={onFileSelect}
                      className="file-input file-input-bordered w-full"
                      accept="image/*,.pdf"
                    />
                    <div className="label">
                      <span className="label-text-alt text-xs text-base-content/60 py-2">
                        Format: JPG, PNG, PDF (max 5MB)
                      </span>
                    </div>

                    {file && (
                      <div className="mt-2">
                        <div className="bg-base-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">File: {file.name}</span>
                          </div>
                          {filePreview ? (
                            <Image
                              src={filePreview}
                              alt="Preview dokumen"
                              width={300}
                              height={300}
                              className="max-w-full h-auto max-h-24 rounded object-contain"
                            />
                          ) : file.type === "application/pdf" ? (
                            <div className="text-xs text-base-content/70">
                              📄 File PDF (preview tidak tersedia)
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual form */}
              {choice === "no_receipt" && (
                <div className="space-y-2">
                  <div>
                    <label className="label">
                      <span className="label-text text-sm font-medium py-1">
                        Tanggal pembayaran *
                      </span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => onDateChange(e.target.value)}
                      className="input input-bordered w-full"
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-sm font-medium py-1">
                        Jumlah pembayaran *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formatRupiah(amount)}
                      onChange={onAmountChange}
                      className="input input-bordered w-full"
                      placeholder="contoh: 300000"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-sm font-medium py-1">
                        Nama Bank / E-Wallet pengirim *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={finEnt}
                      onChange={(e) => onFinEntChange(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="contoh: BCA, BRI, Mandiri, GoPay"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-sm font-medium py-1">
                        Atas nama / nomor rekening pengirim *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={finNumName}
                      onChange={(e) => onFinNumNameChange(e.target.value)}
                      className="input input-bordered w-full"
                      placeholder="contoh: 1234567890 atau Fulan"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error mt-4">
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={handleClose} disabled={isSubmitting}>
                Keluar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (choice === "receipt") onSubmitFile();
                  else if (choice === "no_receipt") onSubmitForm();
                }}
                disabled={submitDisabled}
              >
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                Kirim konfirmasi
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
