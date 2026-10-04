"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatAmountInput } from "@/lib/utils";
import { cn } from "@/lib/utils";
import RichText from "@/components/RichText";
import dynamic from "next/dynamic";
import { kindyAdminApi } from "@/lib/api";
import type {
  AdminInvoice,
  AdminStudent,
  InvoiceFormData,
  StudentOutstanding,
} from "@/lib/types";
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

// TipTap is ~130 kB; load it only when an admin switches Refund on.
const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
});

interface InvoiceFormModalProps {
  mode: "add" | "edit" | null;
  invoice: AdminInvoice | null;
  students: AdminStudent[];
  onClose: () => void;
  onSubmit: (formData: InvoiceFormData) => void;
}

export default function InvoiceFormModal({
  mode,
  invoice,
  students,
  onClose,
  onSubmit,
}: InvoiceFormModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    studentId: "",
    name: "",
    amount: "",
    discount: "0",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    isRefund: false,
    description: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Everything the student has paid, to show what the refund comes to.
  const [totalPaid, setTotalPaid] = useState<number | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        studentId: "",
        name: "",
        amount: "",
        discount: "0",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        isRefund: false,
        description: "",
      });
      setStudentSearch("");
      setFilteredStudents(students);
    } else if (mode === "edit" && invoice) {
      setFormData({
        studentId: "", // Cannot edit studentId
        name: invoice.name,
        // A refund's amountFull is the school's share. Refunds saved before
        // that stored a negative amount; the input only takes digits.
        amount: Math.abs(invoice.amountFull).toString(),
        discount: invoice.discount.toString(),
        startDate: invoice.startDate.split("T")[0],
        dueDate: invoice.dueDate.split("T")[0],
        isRefund: invoice.isRefund,
        description: invoice.description ?? "",
      });
      setStudentSearch("");
      setFilteredStudents(students);
    }
  }, [mode, invoice, students]);

  const refundStudentName =
    mode === "edit"
      ? invoice?.kindyStudentName
      : students.find((s) => s.id === formData.studentId)?.name;

  useEffect(() => {
    if (!mode || !formData.isRefund) return;
    // An existing refund carries its own figure; the outstanding list nets
    // out payouts, so it would understate what was paid.
    if (mode === "edit" && invoice?.refund) {
      setTotalPaid(invoice.refund.totalPaid);
      return;
    }
    if (!refundStudentName) {
      setTotalPaid(null);
      return;
    }
    let cancelled = false;
    kindyAdminApi
      .getAllOutstanding()
      .then((res) => {
        if (cancelled) return;
        const row = (res.data as StudentOutstanding[] | undefined)?.find(
          (s) => s.name === refundStudentName,
        );
        setTotalPaid(row?.totalPayment ?? null);
      })
      .catch(() => {
        if (!cancelled) setTotalPaid(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, formData.isRefund, refundStudentName, invoice]);

  const handleStudentSearch = (searchValue: string) => {
    setStudentSearch(searchValue);
    setShowStudentDropdown(true);

    if (searchValue.trim() === "") {
      setFilteredStudents(students);
      setFormData({ ...formData, studentId: "" });
    } else {
      const filtered = students.filter((student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase()),
      );
      setFilteredStudents(filtered);
    }
  };

  const handleStudentSelect = (student: AdminStudent) => {
    setFormData({ ...formData, studentId: student.id });
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
  };

  const handleContinue = () => {
    // Validate all required fields before showing confirmation
    if (
      mode === "add" &&
      (!formData.studentId ||
        !formData.name ||
        !formData.amount ||
        !formData.discount ||
        !formData.startDate ||
        !formData.dueDate)
    ) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }

    if (
      mode === "edit" &&
      (!formData.name ||
        !formData.amount ||
        !formData.discount ||
        !formData.startDate ||
        !formData.dueDate)
    ) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    onSubmit(formData);
  };

  const handleClose = () => {
    setShowConfirmModal(false);
    onClose();
  };

  if (!mode) return null;

  const discountValue = parseFloat(formData.discount || "0");
  const amountValue = parseFloat(formData.amount || "0");

  return (
    <>
      {/* Main Form Dialog */}
      <Dialog
        open={!showConfirmModal}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Tambah Tagihan" : "Ubah Tagihan"}
            </DialogTitle>
            <DialogDescription>
              Buat tagihan khusus untuk seorang siswa.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {mode === "edit" && invoice && (
              <div className="rounded-lg bg-info-soft px-3 py-2.5 text-[13px] text-info">
                Mengubah tagihan untuk:{" "}
                <strong className="font-semibold">
                  {invoice.kindyStudentName}
                </strong>
              </div>
            )}

            {mode === "add" && (
              <div className="relative flex flex-col gap-1.5">
                <Label>Nama siswa</Label>
                <Input
                  type="text"
                  placeholder="Cari nama siswa…"
                  value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)}
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
                        onClick={() => handleStudentSelect(student)}
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
                {studentSearch && !formData.studentId && (
                  <span className="text-xs text-warning">
                    Pilih siswa dari daftar
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Nama tagihan</Label>
              <Input
                type="text"
                placeholder="mis. Biaya Khusus Karyawisata"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                formData.isRefund
                  ? "border-primary bg-primary-soft"
                  : "border-border",
              )}
            >
              <div>
                <p className="text-[13px] font-medium">Refund</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Penyelesaian siswa keluar; menggantikan semua tagihan lain
                </p>
              </div>
              <Switch
                checked={formData.isRefund}
                onCheckedChange={(checked) =>
                  // A refund carries no discount; the server rejects one.
                  setFormData({ ...formData, isRefund: checked, discount: "0" })
                }
              />
            </div>

            <div
              className={cn("grid gap-3", !formData.isRefund && "grid-cols-2")}
            >
              <div className="flex flex-col gap-1.5">
                <Label>
                  {formData.isRefund ? "Hak sekolah (Rp)" : "Jumlah (Rp)"}
                </Label>
                <Input
                  type="text"
                  className="font-mono"
                  value={formatAmountInput(formData.amount)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, amount: numericValue });
                  }}
                />
                {formData.isRefund && (
                  <p className="text-xs text-muted-foreground">
                    Semua yang menjadi hak sekolah, termasuk SPP bulan yang
                    sudah berjalan. Refund = total pembayaran − hak sekolah.
                    {totalPaid !== null && (
                      <>
                        {" "}
                        Dibayar{" "}
                        <span className="font-mono">
                          {formatCurrency(totalPaid)}
                        </span>{" "}
                        →{" "}
                        {totalPaid - amountValue < 0
                          ? "kurang bayar"
                          : "dikembalikan"}{" "}
                        <span className="font-mono font-medium text-foreground">
                          {formatCurrency(Math.abs(totalPaid - amountValue))}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
              {!formData.isRefund && (
                <div className="flex flex-col gap-1.5">
                  <Label>Diskon (Rp)</Label>
                  <Input
                    type="text"
                    className="font-mono"
                    value={formatAmountInput(formData.discount)}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, discount: numericValue });
                    }}
                  />
                </div>
              )}
            </div>

            {formData.isRefund && (
              <div className="flex flex-col gap-1.5">
                <Label>Rincian hak sekolah</Label>
                <RichTextEditor
                  value={formData.description}
                  // Functional update: the editor may hold an older closure.
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, description: html }))
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Tanggal mulai</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Jatuh tempo</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
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

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmModal}
        onOpenChange={(open) => {
          if (!open) setShowConfirmModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Konfirmasi {mode === "add" ? "Tagihan Baru" : "Perubahan"}
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
              <div className="text-sm font-semibold">
                {mode === "add"
                  ? students.find((s) => s.id === formData.studentId)?.name ||
                    "Tidak diketahui"
                  : invoice?.kindyStudentName}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Nama tagihan
              </div>
              <div className="text-sm">{formData.name}</div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Rincian Jumlah
              </div>
              {formData.isRefund ? (
                <div className="flex flex-col gap-2">
                  {totalPaid !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total pembayaran
                      </span>
                      <span className="text-sm font-medium font-mono">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Hak sekolah
                    </span>
                    <span className="text-sm font-medium font-mono">
                      {formatCurrency(-amountValue)}
                    </span>
                  </div>
                  {totalPaid !== null ? (
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-sm font-semibold">
                        {totalPaid - amountValue < 0
                          ? "Kurang bayar"
                          : "Dikembalikan"}
                      </span>
                      <span className="text-sm font-bold font-mono text-primary">
                        {formatCurrency(Math.abs(totalPaid - amountValue))}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Refund = total pembayaran siswa − hak sekolah, dihitung
                      otomatis.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Jumlah Penuh
                    </span>
                    <span className="text-sm font-medium font-mono">
                      {formatCurrency(amountValue)}
                    </span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Diskon
                      </span>
                      <span className="text-sm font-medium font-mono text-destructive">
                        − {formatCurrency(discountValue)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm font-semibold">Total Akhir</span>
                    <span className="text-sm font-bold font-mono text-primary">
                      {formatCurrency(amountValue - discountValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {formData.isRefund && formData.description && (
              <div className="border-t border-border pt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Rincian hak sekolah
                </div>
                <RichText html={formData.description} className="text-sm" />
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Periode Tagihan
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Tanggal mulai
                  </div>
                  <div className="font-medium">
                    {formatDate(formData.startDate)}
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Jatuh tempo
                  </div>
                  <div className="font-medium">
                    {formatDate(formData.dueDate)}
                  </div>
                </div>
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
            <Button onClick={handleConfirm}>
              {mode === "add" ? "Konfirmasi & Tambah" : "Konfirmasi & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
