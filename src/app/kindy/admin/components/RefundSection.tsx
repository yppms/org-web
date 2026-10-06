"use client";

import { useState } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import type { AdminRefund, AdminStudent } from "@/lib/types";
import { formatAmountInput, formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  SectionHeader,
  Card,
} from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import RefundFormModal, { type RefundFormData } from "./RefundFormModal";

const statusMap: Record<
  AdminRefund["status"],
  { text: string; variant: BadgeProps["variant"] }
> = {
  issued: { text: "Terbit", variant: "warning" },
  paid: { text: "Lunas", variant: "default" },
  partial: { text: "Sebagian", variant: "warning" },
  overdue: { text: "Terlambat", variant: "destructive" },
};

const today = () => new Date().toISOString().split("T")[0];

export default function RefundSection() {
  const {
    data: refundsData,
    isLoading,
    error,
    refetch,
  } = useApi<AdminRefund[]>(() => kindyAdminApi.getRefunds(), {
    fallbackMessage: "Gagal memuat refund",
  });
  const { data: studentsData } = useApi<AdminStudent[]>(() =>
    kindyAdminApi.getAllStudents(),
  );
  const refunds = refundsData ?? [];
  const students = studentsData ?? [];

  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<AdminRefund | null>(null);
  const [deleting, setDeleting] = useState<AdminRefund | null>(null);
  const [transferring, setTransferring] = useState<AdminRefund | null>(null);
  const [transfer, setTransfer] = useState({
    amount: "",
    date: today(),
    reference: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    try {
      await action();
      await refetch();
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : fallback);
      return false;
    }
  };

  const handleFormSubmit = async (data: RefundFormData) => {
    const payload = {
      sourceIds: data.sourceIds,
      share: parseFloat(data.share),
      description: data.description || null,
      dueDate: data.dueDate,
    };
    const ok = await run(
      () =>
        formMode === "edit" && selected
          ? kindyAdminApi.updateRefund(selected.id, payload)
          : kindyAdminApi.addRefund({ studentId: data.studentId, ...payload }),
      "Gagal menyimpan refund. Coba lagi.",
    );
    if (ok) {
      setFormMode(null);
      setSelected(null);
    }
  };

  const openTransfer = (refund: AdminRefund) => {
    setTransfer({
      amount: refund.toTransfer.toString(),
      date: today(),
      reference: "",
    });
    setTransferring(refund);
  };

  const handleTransfer = async () => {
    if (!transferring) return;
    if (!transfer.amount || !transfer.date || !transfer.reference) {
      alert("Lengkapi jumlah, tanggal, dan referensi transfer");
      return;
    }
    const ok = await run(
      () =>
        kindyAdminApi.transferRefund(transferring.id, {
          amount: parseFloat(transfer.amount),
          date: transfer.date,
          reference: transfer.reference,
        }),
      "Gagal mencatat transfer. Coba lagi.",
    );
    if (ok) setTransferring(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await run(
      () => kindyAdminApi.deleteRefund(deleting.id),
      "Gagal menghapus refund. Coba lagi.",
    );
    setDeleting(null);
  };

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Refund"
        subtitle="Penyelesaian tagihan siswa yang keluar"
        actions={
          <Button size="sm" onClick={() => setFormMode("add")}>
            + Tambah
          </Button>
        }
      />

      {actionError && <ErrorAlert message={actionError} />}

      {refunds.length === 0 ? (
        <EmptyState message="Belum ada refund" />
      ) : (
        refunds.map((refund) => {
          const status = statusMap[refund.status];
          return (
            <Card key={refund.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {refund.kindyStudentName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {refund.sources.map((source) => source.name).join(", ")} ·
                    rencana transfer {formatDate(refund.dueDate)}
                  </p>
                </div>
                <Badge variant={status.variant} className="shrink-0">
                  {status.text}
                </Badge>
              </div>

              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  Terbayar{" "}
                  <span className="font-mono">
                    {formatCurrency(refund.totalPaid)}
                  </span>
                </span>
                <span>
                  Total biaya realisasi{" "}
                  <span className="font-mono">
                    {formatCurrency(refund.schoolShare)}
                  </span>
                </span>
              </p>
              <p className="mt-1 text-sm">
                {refund.refundable < 0 ? (
                  <>
                    Kurang bayar{" "}
                    <span className="font-mono font-semibold text-destructive">
                      {formatCurrency(-refund.refundable)}
                    </span>
                  </>
                ) : (
                  <>
                    Dikembalikan{" "}
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(refund.refundable)}
                    </span>
                    {refund.transferred > 0 && refund.toTransfer > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · sisa{" "}
                        <span className="font-mono">
                          {formatCurrency(refund.toTransfer)}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </p>

              <div className="mt-2 flex flex-wrap justify-end gap-0.5">
                {refund.toTransfer > 0 && (
                  <Button size="xs" onClick={() => openTransfer(refund)}>
                    Catat transfer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSelected(refund);
                    setFormMode("edit");
                  }}
                >
                  Ubah
                </Button>
                <Button
                  variant="ghost-destructive"
                  size="xs"
                  onClick={() => setDeleting(refund)}
                >
                  Hapus
                </Button>
              </div>
            </Card>
          );
        })
      )}

      <RefundFormModal
        mode={formMode}
        refund={selected}
        students={students}
        onClose={() => {
          setFormMode(null);
          setSelected(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Catat transfer — the school paying the parent back */}
      <Dialog
        open={!!transferring}
        onOpenChange={(open) => {
          if (!open) setTransferring(null);
        }}
      >
        {transferring && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Transfer Refund</DialogTitle>
              <DialogDescription>
                Transfer dari sekolah ke orang tua{" "}
                <strong className="text-foreground">
                  {transferring.kindyStudentName}
                </strong>
                . Sisa yang harus dikembalikan{" "}
                <span className="font-mono">
                  {formatCurrency(transferring.toTransfer)}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Jumlah ditransfer</Label>
                <Input
                  type="text"
                  className="font-mono"
                  value={formatAmountInput(transfer.amount)}
                  onChange={(e) =>
                    setTransfer({
                      ...transfer,
                      amount: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={transfer.date}
                  onChange={(e) =>
                    setTransfer({ ...transfer, date: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Referensi</Label>
                <Input
                  type="text"
                  placeholder="transfer-bsi"
                  value={transfer.reference}
                  onChange={(e) =>
                    setTransfer({ ...transfer, reference: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferring(null)}>
                Batal
              </Button>
              <Button onClick={handleTransfer}>Catat</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        {deleting && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus refund ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Refund untuk{" "}
                <strong className="text-foreground">
                  {deleting.kindyStudentName}
                </strong>{" "}
                dihapus, dan{" "}
                {deleting.sources.map((source) => source.name).join(", ")}{" "}
                kembali menjadi tagihan biasa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
