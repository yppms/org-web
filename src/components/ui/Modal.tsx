"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Footer actions (buttons). Rendered in a right-aligned modal-action row. */
  actions?: ReactNode;
  /** Set false to prevent closing on backdrop click / Esc (e.g. while submitting). */
  dismissable?: boolean;
  className?: string;
}

/**
 * Controlled wrapper over daisyUI's native <dialog> modal. Replaces the
 * imperative `document.getElementById(id).showModal()` pattern with plain
 * open/onClose props.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  dismissable = true,
  className = "",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle"
      onClose={onClose}
      onCancel={(e) => {
        if (!dismissable) e.preventDefault();
      }}
    >
      <div className={`modal-box ${className}`}>
        {title && <h3 className="text-lg font-bold">{title}</h3>}
        <div className={title ? "mt-4" : ""}>{children}</div>
        {actions && <div className="modal-action">{actions}</div>}
      </div>
      {dismissable && (
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Tutup">close</button>
        </form>
      )}
    </dialog>
  );
}
