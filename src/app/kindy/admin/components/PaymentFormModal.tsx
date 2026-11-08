"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatAmountInput } from "@/lib/utils";
import { kindyAdminApi } from "@/lib/api";
import type {
  UnpaidInvoice,
  AdminPayment,
  AdminStudent,
  PaymentFormData,
  StudentInvoices,
} from "@/lib/types";
import {
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * "add" records a transfer, "saving" pays a bill out of the student's savings
 * (its own action in the admin UI, never a switch inside a transfer), "edit"
 * changes either.
 */
export type PaymentFormMode = "add" | "edit" | "saving";

interface PaymentFormModalProps {
  mode: PaymentFormMode | null;
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
  const isAdd = mode === "add" || mode === "saving";
  const fromSaving = mode === "saving";
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    invoiceIds: [],
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  // Every ordinary bill of the student, paid or not: a payment may be moved
  // to a bill that is already covered by the FIFO fill.
  const [allInvoices, setAllInvoices] = useState<StudentInvoices["invoices"]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editModeStudentId, setEditModeStudentId] = useState<string>("");
  const [shouldFetchInvoices, setShouldFetchInvoices] = useState(false);
  // Editing a refund transfer (a negative payment, attached to a refund) —
  // new transfers are recorded from the Refund tab. Keeps the sign through an
  // edit, since the amount input only takes digits.
  const [isPayout, setIsPayout] = useState(false);
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
        // A payout is stored negative; the input only takes digits.
        amount: Math.abs(payment.amount).toString(),
        date: payment.date.split("T")[0],
        reference: payment.reference,
        invoiceIds: payment.invoiceIds,
      });
      setShouldFetchInvoices(false); // Don't auto-fetch in edit mode
      setIsPayout(payment.amount < 0);
    } else if (isAdd) {
      setFormData({
        studentId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
        invoiceIds: [],
      });
      setStudentSearch("");
      setUnpaidInvoices([]);
      setAllInvoices([]);
      setEditModeStudentId("");
      setShouldFetchInvoices(false);
      setIsPayout(false);
      setSavingBalance(null);
    }
    setFilteredStudents(students);
  }, [mode, isAdd, payment, students]);

  // Fetch the student's bills when a student is selected (add mode) or when
  // explicitly requested (edit mode): the unpaid list carries payout offers,
  // the full list is what a payment can be attached to.
  useEffect(() => {
    const fetchInvoices = async () => {
      const studentIdToUse =
        mode === "edit" ? editModeStudentId : formData.studentId;

      // For add mode: fetch when student is selected
      // For edit mode: only fetch when explicitly requested
      const shouldFetch =
        isAdd
          ? !!studentIdToUse
          : !!studentIdToUse && shouldFetchInvoices;

      if (shouldFetch) {
        setLoadingInvoices(true);
        try {
          const [unpaid, all] = await Promise.all([
            kindyAdminApi.getStudentUnpaidInvoices(studentIdToUse),
            kindyAdminApi.getStudentInvoices(studentIdToUse),
          ]);
          setUnpaidInvoices(
            unpaid.status === "success" && unpaid.data ? unpaid.data : [],
          );
          setAllInvoices(
            all.status === "success" && all.data ? all.data.invoices : [],
          );
        } catch (error) {
          console.error("Failed to fetch invoices:", error);
          setUnpaidInvoices([]);
          setAllInvoices([]);
        } finally {
          setLoadingInvoices(false);
        }
      } else if (isAdd && !studentIdToUse) {
        setUnpaidInvoices([]);
        setAllInvoices([]);
        setFormData((prev) => ({ ...prev, invoiceIds: [] }));
      }
    };

    fetchInvoices();
  }, [mode, isAdd, formData.studentId, editModeStudentId, shouldFetchInvoices]);

  // Fetch the saving balance when paying from savings
  useEffect(() => {
    const studentId = fromSaving ? formData.studentId : "";
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
  }, [formData.studentId, fromSaving]);

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
      isAdd &&
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

    if (isPayout && formData.invoiceIds.length === 0) {
      alert("Pilih refund yang ditransfer");
      return;
    }

    if (insufficientBalance) {
      alert("Saldo tabungan tidak cukup");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    await onSubmit({ ...formData, isSaving: fromSaving, isPayout: isPayout });
    setShowConfirmModal(false);
  };

  // Payout offers, for payout mode: refunds the school still owes on.
  const payoutOptions = unpaidInvoices.filter(
    (invoice) => invoice.status === "refund",
  );
  // Bills a payment can be attached to: every ordinary bill of the student,
  // the ones still owing first, the paid ones after, each group newest due
  // date first. `capacity` is what this payment could put on the bill: what
  // it still owes, or — for a paid bill the payment is being moved to — the
  // whole bill, since an attached payment fills before the loose ones.
  // A refund the parent still owes on is on the unpaid list but not here, so
  // it is added from there.
  const billOf = (inv: { id: string; name: string; amount: number; dueDate: string }, outstanding: number) => ({
    id: inv.id,
    name: inv.name,
    outstanding,
    capacity: outstanding > 0 ? outstanding : inv.amount,
    dueDate: inv.dueDate,
  });
  const billOptions = [
    ...allInvoices.map((inv) => billOf(inv, Math.max(0, inv.amount - inv.paid))),
    ...unpaidInvoices
      .filter(
        (inv) =>
          inv.status !== "refund" && !allInvoices.some((b) => b.id === inv.id),
      )
      .map((inv) => billOf(inv, inv.outstanding)),
  ].sort(
    (a, b) =>
      Number(b.outstanding > 0) - Number(a.outstanding > 0) ||
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
  );
  // Once the ticked bills can absorb the whole amount, ticking more would
  // attach the payment to bills it cannot reach.
  const amountNumber = parseFloat(formData.amount || "0");
  const tickedCapacity = billOptions
    .filter((bill) => formData.invoiceIds.includes(bill.id))
    .reduce((sum, bill) => sum + bill.capacity, 0);
  const covered = !isPayout && amountNumber > 0 && tickedCapacity >= amountNumber;
  // Attached bills not on either list (e.g. a refund since paid), so an edit
  // can still see and untick them.
  const missingAttached =
    mode === "edit" && payment
      ? payment.invoiceIds
          .map((id, i) => ({ id, name: payment.invoiceNames[i] }))
          .filter((bill) => !billOptions.some((b) => b.id === bill.id))
      : [];
  const invoiceOptions = isPayout ? payoutOptions : billOptions;
  const firstPaidIndex = billOptions.findIndex((b) => b.outstanding === 0);
  const toggleInvoice = (id: string) =>
    setFormData((prev) => ({
      ...prev,
      invoiceIds: prev.invoiceIds.includes(id)
        ? prev.invoiceIds.filter((x) => x !== id)
        : [...prev.invoiceIds, id],
    }));
  const signedAmount = parseFloat(formData.amount || "0") * (isPayout ? -1 : 1);

  const insufficientBalance =
    fromSaving &&
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
              {fromSaving
                ? "Bayar dari Tabungan"
                : isAdd
                  ? "Tambah Pembayaran"
                  : "Ubah Pembayaran"}
            </DialogTitle>
            <DialogDescription>
              {fromSaving
                ? "Potong saldo tabungan siswa untuk membayar tagihan."
                : "Catat pembayaran baru dari siswa."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {mode === "edit" && payment && (
              <div className="rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">
                Mengubah pembayaran untuk:{" "}
                <strong>{payment.kindyStudentName}</strong>
                {payment.source === "SAVING" && (
                  <>
                    {" "}
                    · dari tabungan, jumlah tidak bisa diubah
                  </>
                )}
              </div>
            )}

            {isAdd && (
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

            {fromSaving && formData.studentId && (
              <div className="rounded-lg bg-primary-soft px-3 py-2 text-[13px] text-primary">
                Saldo tabungan:{" "}
                <strong>
                  {loadingSavingBalance
                    ? "memuat…"
                    : savingBalance !== null
                      ? formatCurrency(savingBalance)
                      : "gagal dimuat"}
                </strong>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>{isPayout ? "Jumlah ditransfer" : "Jumlah"}</Label>
              {!isPayout && !(mode === "edit" && payment?.source === "SAVING") && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      formData.amount === "300000" &&
                        "border-primary bg-primary-soft text-primary",
                    )}
                    onClick={() =>
                      setFormData({ ...formData, amount: "300000" })
                    }
                  >
                    300K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      formData.amount === "500000" &&
                        "border-primary bg-primary-soft text-primary",
                    )}
                    onClick={() =>
                      setFormData({ ...formData, amount: "500000" })
                    }
                  >
                    500K
                  </Button>
                </div>
              )}
              <Input
                type="text"
                placeholder="40.000"
                className="font-mono"
                disabled={mode === "edit" && payment?.source === "SAVING"}
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
                <Label>
                  {isPayout ? "Refund" : "Lampirkan ke Tagihan (Opsional)"}
                </Label>

                {mode === "edit" &&
                payment &&
                payment.invoiceNames.length > 0 &&
                !shouldFetchInvoices ? (
                  // In edit mode, show current bills with option to change
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
                      <Badge
                        className="mt-0.5"
                        variant={isPayout ? "info" : "default"}
                      >
                        {isPayout ? "Refund" : "Tagihan"}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {payment.invoiceNames.join(", ")}
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
                ) : (isAdd || shouldFetchInvoices) &&
                  (invoiceOptions.length > 0 || missingAttached.length > 0) ? (
                  <div className="flex flex-col gap-2">
                    {isPayout ? (
                      <select
                        className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                        value={formData.invoiceIds[0] || ""}
                        onChange={(e) => {
                          const picked = payoutOptions.find(
                            (invoice) => invoice.id === e.target.value,
                          );
                          setFormData({
                            ...formData,
                            invoiceIds: e.target.value ? [e.target.value] : [],
                            // A payout usually settles the whole remaining credit.
                            ...(picked && {
                              amount: picked.outstanding.toString(),
                            }),
                          });
                        }}
                      >
                        <option value="">-- Pilih refund --</option>
                        {payoutOptions.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {`${invoice.name} | sisa ${formatCurrency(invoice.outstanding)}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex max-h-64 flex-col gap-1 overflow-auto rounded-lg border border-input bg-card p-2">
                        {missingAttached.map((bill) => (
                          <label
                            key={bill.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={formData.invoiceIds.includes(bill.id)}
                              onChange={() => toggleInvoice(bill.id)}
                            />
                            <span className="flex-1">{bill.name}</span>
                            <span className="text-xs text-muted-foreground">
                              lunas
                            </span>
                          </label>
                        ))}
                        {billOptions.map((bill, i) => (
                          <div key={bill.id}>
                            {i === firstPaidIndex && (
                              <div className="mt-1 border-t border-border px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Sudah lunas
                              </div>
                            )}
                            <label
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                                covered && !formData.invoiceIds.includes(bill.id)
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-pointer hover:bg-muted",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="accent-primary"
                                checked={formData.invoiceIds.includes(bill.id)}
                                disabled={
                                  covered && !formData.invoiceIds.includes(bill.id)
                                }
                                onChange={() => toggleInvoice(bill.id)}
                              />
                              <span className="flex-1">{bill.name}</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {bill.outstanding > 0
                                  ? `sisa ${formatCurrency(bill.outstanding)}`
                                  : "lunas"}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isPayout && formData.invoiceIds.length > 0 && amountNumber > 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          covered ? "text-primary" : "text-warning",
                        )}
                      >
                        {covered
                          ? `Tagihan yang dicentang menampung ${formatCurrency(tickedCapacity)}; pembayaran ${formatCurrency(amountNumber)} tertutup.`
                          : `Tagihan yang dicentang hanya menampung ${formatCurrency(tickedCapacity)}; sisa ${formatCurrency(amountNumber - tickedCapacity)} mengalir ke tagihan lain yang belum lunas.`}
                      </p>
                    )}
                    {!isPayout && (
                      <p className="text-xs text-muted-foreground">
                        Tanpa centang, pembayaran mengisi tagihan terlama dulu.
                        Yang dicentang diisi lebih dulu; kelebihannya mengalir
                        ke tagihan lain yang belum lunas. Tagihan yang sudah
                        lunas boleh dicentang untuk memindahkan pembayaran ini
                        ke sana; tagihan yang tadinya terisi akan terbuka lagi.
                      </p>
                    )}
                    {mode === "edit" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setShouldFetchInvoices(false);
                          setFormData({
                            ...formData,
                            invoiceIds: payment?.invoiceIds ?? [],
                          });
                        }}
                      >
                        ← Batal
                      </Button>
                    )}
                  </div>
                ) : isAdd || shouldFetchInvoices ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
                      {isPayout
                        ? "Tidak ada refund yang perlu ditransfer untuk siswa ini"
                        : "Tidak ada tagihan untuk siswa ini"}
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
                            invoiceIds: payment?.invoiceIds ?? [],
                          });
                        }}
                      >
                        ← Batal
                      </Button>
                    )}
                  </div>
                ) : mode === "edit" && !payment?.invoiceNames.length ? (
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
              Konfirmasi{" "}
              {fromSaving
                ? "Pembayaran dari Tabungan"
                : isAdd
                  ? "Pembayaran Baru"
                  : "Perubahan"}
            </DialogTitle>
            <DialogDescription>
              Periksa kembali informasi dengan teliti sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg bg-muted p-4">
            {/* Student Name */}
            {isAdd && (
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
                {isPayout ? "Ditransfer ke Orang Tua" : "Jumlah Pembayaran"}
              </div>
              <div className="font-mono text-lg font-bold">
                {formatCurrency(signedAmount)}
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

            {/* Attached bills (if any) */}
            {formData.invoiceIds.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Dilampirkan ke Tagihan
                </div>
                <div className="flex flex-col gap-1.5">
                  {formData.invoiceIds.map((id) => {
                    const picked = (isPayout ? payoutOptions : billOptions).find(
                      (inv) => inv.id === id,
                    );
                    const name =
                      picked?.name ??
                      payment?.invoiceNames[payment.invoiceIds.indexOf(id)] ??
                      "Tagihan tidak diketahui";
                    return (
                      <div key={id} className="flex items-start gap-2">
                        <Badge
                          className="mt-0.5"
                          variant={isPayout ? "info" : "default"}
                        >
                          {isPayout ? "Refund" : "Tagihan"}
                        </Badge>
                        <div>
                          <div className="text-sm font-semibold">{name}</div>
                          {picked && (
                            <div className="text-xs text-muted-foreground">
                              {isPayout ? "Sisa refund:" : "Tunggakan:"}{" "}
                              {formatCurrency(picked.outstanding)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Savings deduction notice */}
            {fromSaving && (
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
              {isAdd ? "Konfirmasi & Tambah" : "Konfirmasi & Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
