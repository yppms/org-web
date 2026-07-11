"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Modal, Button, Input, Label, ErrorAlert } from "@/components/ui";

type PaymentChoice = "receipt" | "no_receipt" | "";

interface PaymentConfirmModalProps {
  open: boolean;
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

export default function PaymentConfirmModal({
  open,
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
  const submitDisabled =
    isSubmitting ||
    choice === "" ||
    (choice === "receipt" && !file) ||
    (choice === "no_receipt" &&
      (!date || !amount.trim() || !finEnt.trim() || !finNumName.trim()));

  const choiceClass = (selected: boolean) =>
    `h-10 rounded-lg border text-[13px] font-medium transition-colors ${
      selected
        ? "border-primary bg-primary-soft text-foreground"
        : "border-border bg-transparent text-muted-foreground hover:bg-muted"
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={!isSubmitting}
      title={success ? undefined : "Konfirmasi Pembayaran"}
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
              onClick={() => {
                if (choice === "receipt") onSubmitFile();
                else if (choice === "no_receipt") onSubmitForm();
              }}
              disabled={submitDisabled}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirim konfirmasi
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
          <h3 className="mb-2 text-base font-semibold">Konfirmasi terkirim</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {success}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-[13px] text-muted-foreground">
            Apakah Anda memiliki bukti transfer?
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChoiceChange("receipt")}
              className={choiceClass(choice === "receipt")}
            >
              Punya bukti
            </button>
            <button
              type="button"
              onClick={() => onChoiceChange("no_receipt")}
              className={choiceClass(choice === "no_receipt")}
            >
              Tidak ada
            </button>
          </div>

          {choice === "receipt" && (
            <div className="flex flex-col gap-1.5">
              <Label>Unggah bukti transfer</Label>
              <input
                type="file"
                onChange={onFileSelect}
                accept="image/*,.pdf"
                className="w-full rounded-lg border border-input bg-transparent p-2 text-[13px] text-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
              />
              <span className="text-xs text-muted-foreground">
                JPG, PNG, atau PDF · maks. 5MB
              </span>
              {file && (
                <div className="mt-1 rounded-lg bg-muted p-3">
                  <p className="mb-2 text-xs">File: {file.name}</p>
                  {filePreview ? (
                    <Image
                      src={filePreview}
                      alt="Preview dokumen"
                      width={300}
                      height={300}
                      className="h-auto max-h-24 max-w-full rounded object-contain"
                    />
                  ) : file.type === "application/pdf" ? (
                    <p className="text-xs text-muted-foreground">
                      File PDF (preview tidak tersedia)
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {choice === "no_receipt" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Tanggal pembayaran</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Jumlah</Label>
                <Input
                  type="text"
                  value={formatRupiah(amount)}
                  onChange={onAmountChange}
                  placeholder="300000"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Bank / E-Wallet pengirim</Label>
                <Input
                  type="text"
                  value={finEnt}
                  onChange={(e) => onFinEntChange(e.target.value)}
                  placeholder="BCA, BRI, Mandiri, GoPay"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Atas nama / nomor rekening pengirim</Label>
                <Input
                  type="text"
                  value={finNumName}
                  onChange={(e) => onFinNumNameChange(e.target.value)}
                  placeholder="1234567890 atau Fulan"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorAlert message={error} />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
