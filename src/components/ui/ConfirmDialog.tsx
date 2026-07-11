"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Modal from "./Modal";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: ReactNode;
  /** Body: a message string or arbitrary review content. */
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tone of the confirm button. */
  tone?: "primary" | "error" | "warning";
  /** Disable buttons + show a spinner on confirm while an action runs. */
  loading?: boolean;
}

const confirmVariant: Record<
  NonNullable<ConfirmDialogProps["tone"]>,
  "default" | "destructive"
> = {
  primary: "default",
  error: "destructive",
  warning: "default",
};

/**
 * Confirmation modal for the repeated "Continue → Confirm" flow (deletes,
 * payment/withdraw confirmation). Built on <Modal>.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "primary",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      dismissable={!loading}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant[tone]}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
