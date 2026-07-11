"use client";

import { Modal, Button } from "@/components/ui";

interface BankRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onAddBankInfo: () => void;
}

/** Prompts the parent to add receiving-bank info before a withdrawal. */
export default function BankRequiredModal({
  open,
  onClose,
  onAddBankInfo,
}: BankRequiredModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rekening penerimaan dibutuhkan"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" onClick={onAddBankInfo}>
            Tambah rekening
          </Button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Untuk menarik tabungan, mohon isi rekening penerimaan terlebih dahulu.
        Dana yang ditarik akan dikirim ke rekening tersebut melalui transfer.
      </p>
    </Modal>
  );
}
