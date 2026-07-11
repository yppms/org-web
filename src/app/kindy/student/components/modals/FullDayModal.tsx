"use client";

import { Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";

interface FullDayModalProps {
  open: boolean;
  isEnrolled: boolean;
  isSubmitting: boolean;
  success: string | null;
  error: string | null;
  onToggle: () => void;
  onClearError: () => void;
  onClose: () => void;
}

export default function FullDayModal({
  open,
  isEnrolled,
  isSubmitting,
  success,
  error,
  onToggle,
  onClearError,
  onClose,
}: FullDayModalProps) {
  const title = success
    ? undefined
    : error
      ? undefined
      : isEnrolled
        ? "Berhenti Full Day"
        : "Daftar Full Day";

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={!isSubmitting}
      title={title}
      actions={
        success ? (
          <Button size="sm" onClick={onClose}>
            Selesai
          </Button>
        ) : error ? (
          <>
            <Button variant="outline" size="sm" onClick={onClearError}>
              Ulangi
            </Button>
            <Button size="sm" onClick={onClose}>
              Tutup
            </Button>
          </>
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
              variant={isEnrolled ? "destructive" : "default"}
              onClick={onToggle}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEnrolled ? "Ya, berhenti" : "Ya, daftarkan"}
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
          <h3 className="mb-2 text-base font-semibold">Pendaftaran berhasil</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {success}
          </p>
        </div>
      ) : error ? (
        <div className="py-2 text-center">
          <h3 className="mb-2 text-base font-semibold text-destructive">
            Pembaruan gagal
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {error}
          </p>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {isEnrolled
            ? "Ananda dapat mengikuti kembali program full day kapan saja di bulan berikutnya."
            : "Ananda akan mengikuti program full day mulai bulan depan. Biaya bulanan akan bertambah."}
        </p>
      )}
    </Modal>
  );
}
