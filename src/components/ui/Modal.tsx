"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Footer actions (buttons). Rendered in a right-aligned row. */
  actions?: ReactNode;
  /** Set false to prevent closing on overlay click / Esc (e.g. while submitting). */
  dismissable?: boolean;
  className?: string;
}

/**
 * Controlled dialog wrapper (shadcn `Dialog` under the hood) with the legacy
 * open/onClose/title/actions API. Keeps existing callers working after the
 * daisyUI → shadcn migration.
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
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showClose={dismissable}
        onEscapeKeyDown={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        className={className}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div>{children}</div>
        {actions && <DialogFooter>{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
