"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { kindyAdminApi } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatAmountInput } from "@/lib/utils";
import RichText from "@/components/RichText";
import type { AdminRefund, AdminStudent, StudentInvoices } from "@/lib/types";
import {
  Button,
  Input,
  Switch,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";

// TipTap is ~130 kB; load it only when the refund form opens.
const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
});

export interface RefundFormData {
  studentId: string;
  /** The student's bills the refund replaces (tagihan asal). */
  sourceIds: string[];
  /** Hak sekolah — the school's share of those bills; digits only. */
  share: string;
  description: string;
  /** Planned transfer date. */
  dueDate: string;
}

interface RefundFormModalProps {
  mode: "add" | "edit" | null;
  refund: AdminRefund | null;
  students: AdminStudent[];
  onClose: () => void;
  onSubmit: (data: RefundFormData) => void;
}

const today = () => new Date().toISOString().split("T")[0];

export default function RefundFormModal({
  mode,
  refund,
  students,
  onClose,
  onSubmit,
}: RefundFormModalProps) {
  const [formData, setFormData] = useState<RefundFormData>({
    studentId: "",
    sourceIds: [],
    share: "",
    description: "",
    dueDate: today(),
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // The student's bills (to pick the ones the refund replaces) and everything
  // they have paid, to show what the refund comes to.
  const [studentInvoices, setStudentInvoices] =
    useState<StudentInvoices | null>(null);

  useEffect(() => {
    if (mode === "add") {
      setFormData({
        studentId: "",
        sourceIds: [],
        share: "",
        description: "",
        dueDate: today(),
      });
      setStudentSearch("");
    } else if (mode === "edit" && refund) {
      setFormData({
        studentId: refund.KindyStudent.id,
        sourceIds: refund.sources.map((source) => source.id),
        share: refund.schoolShare.toString(),
        description: refund.description ?? "",
        dueDate: refund.dueDate.split("T")[0],
      });
    }
  }, [mode, refund]);

  useEffect(() => {
    if (!mode || !formData.studentId) {
      setStudentInvoices(null);
      return;
    }
    let cancelled = false;
    kindyAdminApi
      .getStudentInvoices(formData.studentId)
      .then((res) => {
        if (!cancelled) setStudentInvoices(res.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setStudentInvoices(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, formData.studentId]);

  if (!mode) return null;

  // Once money has gone back, the server refuses to change the share or the
  // bills (the transfer was capped against them); only the breakdown and the
  // date stay editable.
  const locked = mode === "edit" && !!refund && refund.transferred > 0;

  const filteredStudents = studentSearch.trim()
    ? students.filter((student) =>
        student.name.toLowerCase().includes(studentSearch.toLowerCase()),
      )
    : students;

  // Bills this refund can replace: any not already replaced by another one.
  const sourceOptions =
    studentInvoices?.invoices.filter(
      (bill) => !bill.supersededById || bill.supersededById === refund?.id,
    ) ?? [];
  const pickedSources = sourceOptions.filter((bill) =>
    formData.sourceIds.includes(bill.id),
  );

  const toggleSource = (id: string) =>
    setFormData((prev) => ({
      ...prev,
      sourceIds: prev.sourceIds.includes(id)
        ? prev.sourceIds.filter((sourceId) => sourceId !== id)
        : [...prev.sourceIds, id],
    }));

  const share = parseFloat(formData.share || "0");
  // What the server will show (alloc.util.js, readSettlement): everything
  // paid, less the bills the refund leaves alone, less the share. At or below
  // zero there is nothing to refund; what is still owed may sit on the
  // replaced bills or on the others.
  const preview = studentInvoices
    ? studentInvoices.totalPaid -
      studentInvoices.invoices
        .filter((bill) => !formData.sourceIds.includes(bill.id))
        .reduce((sum, bill) => sum + bill.amount, 0) -
      share
    : null;

  const studentName =
    mode === "edit"
      ? refund?.kindyStudentName
      : students.find((s) => s.id === formData.studentId)?.name;

  const handleContinue = () => {
    if (
      !formData.studentId ||
      formData.sourceIds.length === 0 ||
      !formData.share ||
      !formData.dueDate
    ) {
      alert(
        "Pilih siswa dan tagihan, lalu isi total biaya realisasi dan tanggal transfer",
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const handleClose = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const breakdown =
    preview === null ? null : preview > 0 ? (
      <>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Terbayar</span>
          <span className="font-mono text-sm font-medium">
            {formatCurrency(share + preview)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total biaya realisasi
          </span>
          <span className="font-mono text-sm font-medium text-warning">
            {formatCurrency(-share)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-semibold">Dikembalikan</span>
          <span className="font-mono text-sm font-bold text-primary">
            {formatCurrency(preview)}
          </span>
        </div>
      </>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total biaya realisasi
          </span>
          <span className="font-mono text-sm font-medium text-warning">
            {formatCurrency(-share)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-semibold">
            Tidak ada refund; masih kurang
          </span>
          <span className="font-mono text-sm font-bold text-destructive">
            {formatCurrency(-preview)}
          </span>
        </div>
      </>
    );

  return (
    <>
      <Dialog
        open={!showConfirmModal}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Tambah Refund" : "Ubah Refund"}
            </DialogTitle>
            <DialogDescription>
              Ganti tagihan siswa yang keluar dengan total biaya realisasinya.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {mode === "edit" ? (
              <div className="rounded-lg bg-info-soft px-3 py-2.5 text-[13px] text-info">
                Refund untuk:{" "}
                <strong className="font-semibold">{studentName}</strong>
              </div>
            ) : (
              <div className="relative flex flex-col gap-1.5">
                <Label>Nama siswa</Label>
                <Input
                  type="text"
                  placeholder="Cari nama siswa…"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                    setFormData((prev) => ({
                      ...prev,
                      studentId: "",
                      sourceIds: [],
                    }));
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowStudentDropdown(false), 200);
                  }}
                />
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            studentId: student.id,
                            sourceIds: [],
                          }));
                          setStudentSearch(student.name);
                          setShowStudentDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-muted",
                          formData.studentId === student.id &&
                            "bg-primary-soft",
                        )}
                      >
                        {student.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Tagihan yang di-refund</Label>
              {!formData.studentId ? (
                <p className="text-xs text-muted-foreground">
                  Pilih siswa dulu.
                </p>
              ) : !studentInvoices ? (
                <p className="text-xs text-muted-foreground">Memuat tagihan…</p>
              ) : sourceOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Siswa ini belum punya tagihan yang bisa di-refund.
                </p>
              ) : (
                sourceOptions.map((bill) => {
                  const picked = formData.sourceIds.includes(bill.id);
                  return (
                    <div
                      key={bill.id}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors",
                        picked
                          ? "border-primary bg-primary-soft"
                          : "border-border",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium">{bill.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {formatCurrency(bill.amount)}
                          </span>{" "}
                          · dibayar{" "}
                          <span className="font-mono">
                            {formatCurrency(bill.paid)}
                          </span>
                        </p>
                      </div>
                      <Switch
                        className="shrink-0"
                        checked={picked}
                        disabled={locked}
                        onCheckedChange={() => toggleSource(bill.id)}
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Total biaya realisasi (Rp)</Label>
              <Input
                type="text"
                className="font-mono"
                disabled={locked}
                value={formatAmountInput(formData.share)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, share: numericValue });
                }}
              />
              <p className="text-xs text-muted-foreground">
                {locked
                  ? "Sudah ada transfer; hapus transfernya dulu untuk mengubah total biaya realisasi atau tagihan."
                  : "Biaya yang tetap menjadi hak sekolah atas tagihan yang dipilih. Refund = yang sudah dibayar untuk tagihan itu − total biaya realisasi."}
                {!locked &&
                  preview !== null &&
                  formData.sourceIds.length > 0 &&
                  (preview > 0 ? (
                    <>
                      {" "}
                      Terbayar{" "}
                      <span className="font-mono">
                        {formatCurrency(share + preview)}
                      </span>{" "}
                      → dikembalikan{" "}
                      <span className="font-mono font-medium text-foreground">
                        {formatCurrency(preview)}
                      </span>
                    </>
                  ) : (
                    <>
                      {" "}
                      Tidak ada refund; masih kurang{" "}
                      <span className="font-mono font-medium text-destructive">
                        {formatCurrency(-preview)}
                      </span>
                    </>
                  ))}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Kebijakan refund</Label>
              <RichTextEditor
                value={formData.description}
                // Functional update: the editor may hold an older closure.
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, description: html }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Rencana transfer</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button onClick={handleContinue}>
              {mode === "add" ? "Lanjut" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmModal}
        onOpenChange={(open) => {
          if (!open) setShowConfirmModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Konfirmasi {mode === "add" ? "Refund Baru" : "Perubahan"}
            </DialogTitle>
            <DialogDescription>
              Periksa kembali informasi dengan teliti sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg bg-muted p-4">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Siswa
              </div>
              <div className="text-sm font-semibold">{studentName}</div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Tagihan yang di-refund
              </div>
              <div className="text-sm">
                {pickedSources.map((bill) => bill.name).join(", ")}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground">
                Rincian Refund
              </div>
              {breakdown}
            </div>

            {formData.description && (
              <div className="border-t border-border pt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Kebijakan refund
                </div>
                <RichText html={formData.description} className="text-sm" />
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Rencana transfer
              </div>
              <div className="text-sm font-medium">
                {formatDate(formData.dueDate)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Kembali
            </Button>
            <Button
              onClick={() => {
                setShowConfirmModal(false);
                onSubmit(formData);
              }}
            >
              {mode === "add" ? "Konfirmasi & Tambah" : "Konfirmasi & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
