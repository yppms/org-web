"use client";

import { useState, useMemo } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminPayment, AdminStudent, PaymentFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
  Input,
  Chip,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui";
import PaymentFormModal from "./PaymentFormModal";

export default function PaymentSection() {
  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = useApi<AdminPayment[]>(() => kindyAdminApi.getPayments(), {
    fallbackMessage: "Gagal memuat pembayaran",
  });
  const { data: studentsData } = useApi<AdminStudent[]>(() => kindyAdminApi.getAllStudents());

  const payments = useMemo(() => paymentsData ?? [], [paymentsData]);
  const students = studentsData ?? [];

  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "date">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: PaymentFormData) => {
    setActionError(null);
    try {
      if (formMode === "add") {
        await kindyAdminApi.addPayment({
          studentId: formData.studentId,
          amount: parseFloat(formData.amount),
          date: formData.date,
          reference: formData.reference,
          invoiceId: formData.invoiceId || null,
          isSaving: formData.isSaving || false,
        });
      } else if (formMode === "edit" && selectedPayment) {
        await kindyAdminApi.updatePayment(selectedPayment.id, {
          amount: parseFloat(formData.amount),
          date: formData.date,
          reference: formData.reference,
          invoiceId: formData.invoiceId || null,
        });
      }
      await refetch();
      setFormMode(null);
      setSelectedPayment(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menyimpan pembayaran. Coba lagi."
      );
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    setActionError(null);
    try {
      await kindyAdminApi.deletePayment(selectedPayment.id);
      await refetch();
      setShowDeleteModal(false);
      setSelectedPayment(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menghapus pembayaran. Coba lagi."
      );
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setFormMode("edit");
  };

  const openDeleteModal = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  const toggleGroup = (date: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(
      (payment) =>
        payment.kindyStudentName.toLowerCase().includes(query) ||
        payment.reference.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  const groupedPayments = useMemo(() => {
    return filteredPayments.reduce((groups, payment) => {
      const dateValue =
        sortBy === "createdAt"
          ? payment.createdAt
          : sortBy === "updatedAt"
          ? payment.updatedAt
          : payment.date;
      const d = new Date(dateValue);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!groups[date]) groups[date] = [];
      groups[date].push(payment);
      return groups;
    }, {} as Record<string, AdminPayment[]>);
  }, [filteredPayments, sortBy]);

  const sortedDates = useMemo(
    () => Object.keys(groupedPayments).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedPayments]
  );

  const sortOptions: { key: "createdAt" | "updatedAt" | "date"; label: string }[] = [
    { key: "createdAt", label: "Dibuat" },
    { key: "updatedAt", label: "Diperbarui" },
    { key: "date", label: "Tgl bayar" },
  ];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pembayaran</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Catat semua transaksi pembayaran siswa
          </p>
        </div>
        <Button size="sm" onClick={() => setFormMode("add")} className="shrink-0">
          + Tambah
        </Button>
      </div>

      {actionError && <ErrorAlert message={actionError} />}

      <Input
        type="text"
        placeholder="Cari nama siswa atau referensi…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">Urutkan</span>
        {sortOptions.map((option) => (
          <Chip
            key={option.key}
            active={sortBy === option.key}
            onClick={() => setSortBy(option.key)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {payments.length === 0 ? (
          <EmptyState message="Belum ada pembayaran" />
        ) : filteredPayments.length === 0 ? (
          <EmptyState message={`Tidak ada pembayaran dengan kata kunci "${searchQuery}"`} />
        ) : (
          sortedDates.map((date) => {
            const isOpen = !collapsedGroups.has(date);
            const groupCount = groupedPayments[date].length;

            return (
              <div key={date} className="flex flex-col gap-2">
                <button
                  onClick={() => toggleGroup(date)}
                  className="flex w-full items-center gap-2 py-1"
                >
                  <span
                    className="transition-transform"
                    style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                  >
                    ▸
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    {formatDate(date)}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                    {groupCount}
                  </span>
                  <span className="flex-1 border-t border-border" />
                </button>

                {isOpen &&
                  groupedPayments[date].map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {payment.kindyStudentName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payment.reference} · dicatat {formatDate(payment.createdAt)}
                          </p>
                          {payment.invoiceName && (
                            <span className="mt-1.5 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {payment.invoiceName}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="font-mono text-sm font-semibold">
                            {formatCurrency(payment.amount)}
                          </span>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => openEditModal(payment)}
                            >
                              Ubah
                            </Button>
                            <Button
                              variant="ghost-destructive"
                              size="xs"
                              onClick={() => openDeleteModal(payment)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      <PaymentFormModal
        mode={formMode}
        payment={selectedPayment}
        students={students}
        onClose={() => {
          setFormMode(null);
          setSelectedPayment(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteModal(false);
            setSelectedPayment(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data untuk{" "}
              <strong className="text-foreground">
                {selectedPayment?.kindyStudentName}
              </strong>{" "}
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPayment && (
            <div className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-mono font-medium">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">{formatDate(selectedPayment.date)}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
