"use client";

import { ReactNode } from "react";
import Modal from "./Modal";

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

const confirmClass = {
  primary: "btn-primary",
  error: "btn-error",
  warning: "btn-warning",
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
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${confirmClass[tone]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
