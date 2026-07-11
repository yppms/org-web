"use client";

import { Modal, Button } from "@/components/ui";

interface GlobalErrorModalProps {
  message: string | null;
  onClose: () => void;
}

/** App-wide error dialog for the student dashboard. Open when message is set. */
export default function GlobalErrorModal({
  message,
  onClose,
}: GlobalErrorModalProps) {
  return (
    <Modal
      open={!!message}
      onClose={onClose}
      title="Terjadi kesalahan"
      actions={
        <Button size="sm" onClick={onClose}>
          Mengerti
        </Button>
      }
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {message}
      </p>
    </Modal>
  );
}
