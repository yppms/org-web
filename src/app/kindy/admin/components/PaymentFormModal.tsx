"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatAmountInput } from "@/lib/utils";
import { kindyAdminApi } from "@/lib/api";
import type {
  UnpaidInvoice,
  AdminPayment,
  AdminStudent,
  PaymentFormData,
} from "@/lib/types";
import {
  Button,
  Input,
  Label,
  Switch,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PaymentFormModalProps {
  mode: "add" | "edit" | null;
  payment: AdminPayment | null;
  students: AdminStudent[];
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export default function PaymentFormModal({
  mode,
  payment,
  students,
  onClose,
  onSubmit,
}: PaymentFormModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    invoiceId: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editModeStudentId, setEditModeStudentId] = useState<string>("");
  const [shouldFetchInvoices, setShouldFetchInvoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingBalance, setSavingBalance] = useState<number | null>(null);
  const [loadingSavingBalance, setLoadingSavingBalance] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (mode === "edit" && payment) {
      // Find student ID by name (for edit mode to fetch invoices)
      const student = students.find((s) => s.name === payment.kindyStudentName);
      const studentId = student?.id || "";
      setEditModeStudentId(studentId);

      setFormData({
        studentId: studentId,
        amount: payment.amount.toString(),
        date: payment.date.split("T")[0],
        reference: payment.reference,
        invoiceId: payment.invoiceId || "",
      });
      setShouldFetchInvoices(false); // Don't auto-fetch in edit mode
    } else if (mode === "add") {
      setFormData({
        studentId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
        invoiceId: "",
      });
      setStudentSearch("");
      setUnpaidInvoices([]);
      setEditModeStudentId("");
      setShouldFetchInvoices(false);
      setIsSaving(false);
      setSavingBalance(null);
    }
    setFilteredStudents(students);
  }, [mode, payment, students]);

  // Fetch unpaid invoices when student is selected (add mode) or when explicitly requested (edit mode)
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      const studentIdToUse =
        mode === "edit" ? editModeStudentId : formData.studentId;

      // For add mode: fetch when student is selected
      // For edit mode: only fetch when explicitly requested
      const shouldFetch =
        mode === "add"
          ? !!studentIdToUse
          : !!studentIdToUse && shouldFetchInvoices;

      if (shouldFetch) {
        setLoadingInvoices(true);
        try {
          const response =
            await kindyAdminApi.getStudentUnpaidInvoices(studentIdToUse);
          if (response.status === "success" && response.data) {
            setUnpaidInvoices(response.data);
          } else {
            setUnpaidInvoices([]);
          }
        } catch (error) {
          console.error("Failed to fetch unpaid invoices:", error);
          setUnpaidInvoices([]);
        } finally {
          setLoadingInvoices(false);
        }
      } else if (mode === "add" && !studentIdToUse) {
        setUnpaidInvoices([]);
        setFormData((prev) => ({ ...prev, invoiceId: "" }));
      }
    };

    fetchUnpaidInvoices();
  }, [mode, formData.studentId, editModeStudentId, shouldFetchInvoices]);

  // Fetch saving balance whenever a student is selected (add mode)
  useEffect(() => {
    const studentId = mode === "add" ? formData.studentId : editModeStudentId;
    if (!studentId) {
      setSavingBalance(null);
      return;
    }
    const fetchBalance = async () => {
      setLoadingSavingBalance(true);
      try {
        const res = await kindyAdminApi.getStudentSavingBalance(studentId);
        setSavingBalance(res.data?.availableSaving ?? null);
      } catch {
        setSavingBalance(null);
      } finally {
        setLoadingSavingBalance(false);
      }
    };
    fetchBalance();
  }, [formData.studentId, editModeStudentId, mode]);

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

  const openConfirmModal = () => {
    // Validate all required fields
    if (
      mode === "add" &&
      (!formData.studentId ||
        !formData.amount ||
        !formData.date ||
        !formData.reference)
    ) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }

    if (
      mode === "edit" &&
      (!formData.amount || !formData.date || !formData.reference)
    ) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    await onSubmit({ ...formData, isSaving: isSaving });
    setShowConfirmModal(false);
  };

  const insufficientBalance =
    isSaving &&
    savingBalance !== null &&
    !!formData.amount &&
    parseFloat(formData.amount) > savingBalance;

  return (
    <>
      {/* Form Modal */}
      <Dialog
        open={!!mode}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Tambah Pembayaran" : "Ubah Pembayaran"}
            </DialogTitle>
            <DialogDescription>
              Catat pembayaran baru dari siswa.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {mode === "edit" && payment && (
              <div className="rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">
                Mengubah pembayaran untuk:{" "}
                <strong>{payment.kindyStudentName}</strong>
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
                    setTimeout(() => setShowStudentDropdown(false), 200);
                  }}
                />
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleStudentSelect(student);
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
                {studentSearch && !formData.studentId && (
                  <span className="text-xs text-warning">
                    Pilih siswa dari daftar
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Jumlah</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    formData.amount === "300000" &&
                      "border-primary bg-primary-soft text-primary",
                  )}
                  onClick={() => setFormData({ ...formData, amount: "300000" })}
                >
                  Reguler 300K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    formData.amount === "600000" &&
                      "border-primary bg-primary-soft text-primary",
                  )}
                  onClick={() => setFormData({ ...formData, amount: "600000" })}
                >
                  Full Day 600K
                </Button>
              </div>
              <Input
                type="text"
                placeholder="40.000"
                className="font-mono"
                value={formatAmountInput(formData.amount)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, amount: numericValue });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Referensi</Label>
              <Input
                type="text"
                placeholder="transfer-bsi"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
              />
            </div>

            {/* Optional Invoice Attachment - Show in both Add and Edit mode */}
            {formData.studentId && (
              <div className="flex flex-col gap-1.5">
                <Label>Lampirkan ke Tagihan (Opsional)</Label>

                {mode === "edit" &&
                payment?.invoiceName &&
                !shouldFetchInvoices ? (
                  // In edit mode, show current invoice with option to change
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                      <Badge>Tagihan</Badge>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {payment.invoiceName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tagihan terlampir saat ini
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setShouldFetchInvoices(true)}
                    >
                      Ubah atau Hapus Tagihan
                    </Button>
                  </div>
                ) : loadingInvoices ? (
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Memuat tagihan…
                    </span>
                  </div>
                ) : (mode === "add" || shouldFetchInvoices) &&
                  unpaidInvoices.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                      value={formData.invoiceId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceId: e.target.value })
                      }
                    >
                      <option value="">-- Tanpa tagihan --</option>
                      {unpaidInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.name} | {formatCurrency(invoice.outstanding)}{" "}
                          | {invoice.daysLate} hari
                        </option>
                      ))}
                    </select>
                    {mode === "edit" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setShouldFetchInvoices(false);
                          setFormData({
                            ...formData,
                            invoiceId: payment?.invoiceId || "",
                          });
                        }}
                      >
                        ← Batal
                      </Button>
                    )}
                  </div>
                ) : mode === "add" || shouldFetchInvoices ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
                      Tidak ada tagihan belum lunas untuk siswa ini
                    </div>
                    {mode === "edit" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setShouldFetchInvoices(false);
                          setFormData({
                            ...formData,
                            invoiceId: payment?.invoiceId || "",
                          });
                        }}
                      >
                        ← Batal
                      </Button>
                    )}
                  </div>
                ) : mode === "edit" && !payment?.invoiceName ? (
                  // Edit mode, no current invoice, not fetching yet
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShouldFetchInvoices(true)}
                  >
                    + Lampirkan ke Tagihan
                  </Button>
                ) : null}
              </div>
            )}

            {/* Pay from savings toggle — add mode only */}
            {mode === "add" && (
              <div
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                  isSaving ? "border-primary bg-primary-soft" : "border-border",
                )}
              >
                <div>
                  <p className="text-[13px] font-medium">Bayar dari tabungan</p>
                  {formData.studentId ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {loadingSavingBalance ? (
                        "Memuat saldo…"
                      ) : savingBalance !== null ? (
                        <>
                          Saldo:{" "}
                          <strong>{formatCurrency(savingBalance)}</strong>
                        </>
                      ) : (
                        "Gagal memuat saldo"
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Saldo dipotong otomatis
                    </p>
                  )}
                </div>
                <Switch checked={isSaving} onCheckedChange={setIsSaving} />
              </div>
            )}

            {insufficientBalance && savingBalance !== null && (
              <div className="rounded-lg bg-destructive-soft px-3 py-2 text-xs text-destructive">
                Saldo tidak cukup. Dibutuhkan{" "}
                {formatCurrency(parseFloat(formData.amount))}, tersedia{" "}
                {formatCurrency(savingBalance)}.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button size="sm" onClick={openConfirmModal}>
              Lanjut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onOpenChange={(open) => {
          if (!open) setShowConfirmModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Konfirmasi {mode === "add" ? "Pembayaran Baru" : "Perubahan"}
            </DialogTitle>
            <DialogDescription>
              Periksa kembali informasi dengan teliti sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg bg-muted p-4">
            {/* Student Name */}
            {mode === "add" && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Siswa
                </div>
                <div className="text-base font-semibold">
                  {students.find((s) => s.id === formData.studentId)?.name ||
                    "Tidak diketahui"}
                </div>
              </div>
            )}

            {mode === "edit" && payment && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Siswa
                </div>
                <div className="text-base font-semibold">
                  {payment.kindyStudentName}
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="border-t border-border pt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Jumlah Pembayaran
              </div>
              <div className="font-mono text-lg font-bold">
                {formatCurrency(parseFloat(formData.amount || "0"))}
              </div>
            </div>

            {/* Date */}
            <div className="border-t border-border pt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Tanggal Pembayaran
              </div>
              <div className="text-sm font-medium">
                {formatDate(formData.date)}
              </div>
            </div>

            {/* Reference */}
            <div className="border-t border-border pt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Nomor Referensi
              </div>
              <div className="font-mono text-sm">{formData.reference}</div>
            </div>

            {/* Attached Invoice (if selected) */}
            {formData.invoiceId && (
              <div className="border-t border-border pt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Dilampirkan ke Tagihan
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="mt-0.5">Tagihan</Badge>
                  <div>
                    <div className="text-sm font-semibold">
                      {unpaidInvoices.find(
                        (inv) => inv.id === formData.invoiceId,
                      )?.name ||
                        payment?.invoiceName ||
                        "Tagihan tidak diketahui"}
                    </div>
                    {unpaidInvoices.find(
                      (inv) => inv.id === formData.invoiceId,
                    ) && (
                      <div className="text-xs text-muted-foreground">
                        Tunggakan:{" "}
                        {formatCurrency(
                          unpaidInvoices.find(
                            (inv) => inv.id === formData.invoiceId,
                          )?.outstanding || 0,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Savings deduction notice */}
            {isSaving && (
              <div className="border-t border-border pt-3">
                <div className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                  Pembayaran akan dipotong dari <strong>tabungan siswa</strong>
                  {savingBalance !== null
                    ? ` (saldo: ${formatCurrency(savingBalance)})`
                    : ""}
                  .
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              ← Kembali
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              {mode === "add" ? "Konfirmasi & Tambah" : "Konfirmasi & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
