"use client";

import { useState, useMemo } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminPayment, AdminStudent, PaymentFormData } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
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
import PaymentFormModal, { type PaymentFormMode } from "./PaymentFormModal";
import ListControls, { useSort, ViewControls } from "@/components/ListControls";

type PaymentFilter = "all" | "transfer" | "saving" | "payout";
type PaymentSortKey = "date" | "createdAt" | "updatedAt";

export default function PaymentSection() {
  const {
    data: paymentsData,
    isLoading,
    error,
    refetch,
  } = useApi<AdminPayment[]>(() => kindyAdminApi.getPayments(), {
    fallbackMessage: "Gagal memuat pembayaran",
  });
  const { data: studentsData } = useApi<AdminStudent[]>(() =>
    kindyAdminApi.getAllStudents(),
  );

  const payments = useMemo(() => paymentsData ?? [], [paymentsData]);
  const students = studentsData ?? [];

  const [formMode, setFormMode] = useState<PaymentFormMode | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(
    null,
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [compact, setCompact] = useState(false);
  const { sortBy, order, toggle, signed } = useSort<PaymentSortKey>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: PaymentFormData) => {
    setActionError(null);
    // A refund payout is the school paying out, so it is stored negative.
    const amount = parseFloat(formData.amount) * (formData.isPayout ? -1 : 1);
    try {
      if (formMode === "add" || formMode === "saving") {
        await kindyAdminApi.addPayment({
          studentId: formData.studentId,
          amount,
          date: formData.date,
          reference: formData.reference,
          invoiceIds: formData.invoiceIds,
          isSaving: formData.isSaving || false,
        });
      } else if (formMode === "edit" && selectedPayment) {
        await kindyAdminApi.updatePayment(selectedPayment.id, {
          amount,
          date: formData.date,
          reference: formData.reference,
          invoiceIds: formData.invoiceIds,
        });
      }
      await refetch();
      setFormMode(null);
      setSelectedPayment(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Gagal menyimpan pembayaran. Coba lagi.",
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
        err instanceof ApiError
          ? err.message
          : "Gagal menghapus pembayaran. Coba lagi.",
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
    let list = payments;
    if (filter === "transfer")
      list = list.filter((p) => p.source === "TRANSFER" && p.amount > 0);
    else if (filter === "saving") list = list.filter((p) => p.source === "SAVING");
    else if (filter === "payout") list = list.filter((p) => p.amount < 0);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (payment) =>
        payment.kindyStudentName.toLowerCase().includes(query) ||
        payment.reference.toLowerCase().includes(query) ||
        payment.invoiceNames.some((name) => name.toLowerCase().includes(query)),
    );
  }, [payments, searchQuery, filter]);

  const groupedPayments = useMemo(() => {
    return filteredPayments.reduce(
      (groups, payment) => {
        const dateValue =
          sortBy === "createdAt"
            ? payment.createdAt
            : sortBy === "updatedAt"
              ? payment.updatedAt
              : payment.date;
        const d = new Date(dateValue);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;
        if (!groups[date]) groups[date] = [];
        groups[date].push(payment);
        return groups;
      },
      {} as Record<string, AdminPayment[]>,
    );
  }, [filteredPayments, sortBy]);

  const sortedDates = useMemo(
    () =>
      Object.keys(groupedPayments).sort((a, b) =>
        signed(new Date(a).getTime() - new Date(b).getTime()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupedPayments, order],
  );

  const allOpen = sortedDates.every((date) => !collapsedGroups.has(date));
  const toggleAll = () =>
    setCollapsedGroups(allOpen ? new Set(sortedDates) : new Set());

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Pembayaran"
        subtitle="Catat semua transaksi pembayaran siswa"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFormMode("saving")}
            >
              Dari tabungan
            </Button>
            <Button size="sm" onClick={() => setFormMode("add")}>
              + Tambah
            </Button>
          </div>
        }
      />

      {actionError && <ErrorAlert message={actionError} />}

      <ListControls
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama siswa, referensi, atau tagihan…",
        }}
        filter={{
          options: [
            { key: "all", label: "Semua" },
            { key: "transfer", label: "Transfer" },
            { key: "saving", label: "Dari tabungan" },
            { key: "payout", label: "Transfer refund" },
          ],
          value: filter,
          onChange: setFilter,
        }}
        sort={{
          options: [
            { key: "date", label: "Tgl bayar" },
            { key: "createdAt", label: "Dibuat" },
            { key: "updatedAt", label: "Diperbarui" },
          ],
          value: sortBy,
          order,
          onChange: toggle,
        }}
      />

      {filteredPayments.length > 0 && (
        <ViewControls
          allOpen={allOpen}
          onToggleAll={toggleAll}
          compact={compact}
          onToggleCompact={() => setCompact(!compact)}
        />
      )}

      <div className="flex flex-col gap-4">
        {payments.length === 0 ? (
          <EmptyState message="Belum ada pembayaran" />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? `Tidak ada pembayaran dengan kata kunci "${searchQuery}"`
                : "Tidak ada pembayaran untuk filter ini"
            }
          />
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
                  !compact &&
                  groupedPayments[date].map((payment) => (
                    <Card key={payment.id} className="px-4 py-3.5">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {payment.kindyStudentName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payment.reference} · dicatat{" "}
                            {formatDate(payment.createdAt)}
                          </p>
                          {payment.source === "SAVING" && (
                            <span className="mt-1.5 inline-block rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                              Dari tabungan
                            </span>
                          )}
                          {payment.invoiceNames.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {payment.invoiceNames.map((name) => (
                                <span
                                  key={name}
                                  className={cn(
                                    "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                                    // Negative = the school paying out a refund.
                                    payment.amount < 0
                                      ? "bg-info-soft text-info"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {payment.amount < 0 && "Transfer "}
                                  {name}
                                </span>
                              ))}
                            </div>
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
                    </Card>
                  ))}

                {isOpen && compact && (
                  <Card className="px-4">
                    {groupedPayments[date].map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0"
                      >
                        <p className="min-w-0 pt-1 text-sm font-medium">
                          {payment.kindyStudentName}
                          {payment.source === "SAVING" && (
                            <span className="ml-1.5 text-xs font-normal text-primary">
                              tabungan
                            </span>
                          )}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            className={cn(
                              "font-mono text-sm font-semibold",
                              payment.amount < 0 && "text-info",
                            )}
                          >
                            {formatCurrency(payment.amount)}
                          </span>
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
                    ))}
                  </Card>
                )}
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
                <span className="font-medium">
                  {formatDate(selectedPayment.date)}
                </span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
