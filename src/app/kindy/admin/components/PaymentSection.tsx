"use client";

import { useState, useMemo } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminPayment, AdminStudent, PaymentFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert } from "@/components/ui";
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

  const collapseAll = () => setCollapsedGroups(new Set(sortedDates));
  const expandAll = () => setCollapsedGroups(new Set());

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Data Pembayaran</h2>
          <button onClick={() => setFormMode("add")} className="btn btn-sm btn-primary">
            + Tambah
          </button>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          Catat semua transaksi pembayaran siswa
        </p>

        {actionError && (
          <div className="mb-4">
            <ErrorAlert message={actionError} />
          </div>
        )}

        <input
          type="text"
          placeholder="Cari nama siswa atau referensi..."
          className="input input-bordered input-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-base-content/70 font-medium">Urutkan:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "createdAt" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSortBy("createdAt")}
            >
              Dibuat
            </button>
            <button
              className={`btn btn-xs ${sortBy === "updatedAt" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSortBy("updatedAt")}
            >
              Diperbarui
            </button>
            <button
              className={`btn btn-xs ${sortBy === "date" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSortBy("date")}
            >
              Tgl Bayar
            </button>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={collapseAll} className="btn btn-xs btn-ghost">
              📁 Tutup Semua
            </button>
            <button onClick={expandAll} className="btn btn-xs btn-ghost">
              📂 Buka Semua
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">Belum ada pembayaran</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            Tidak ada pembayaran dengan kata kunci &quot;{searchQuery}&quot;
          </div>
        ) : (
          sortedDates.map((date) => {
            const isCollapsed = collapsedGroups.has(date);
            const groupCount = groupedPayments[date].length;

            return (
              <div key={date} className="space-y-3">
                <button
                  onClick={() => toggleGroup(date)}
                  className="w-full sticky top-0 bg-base-200/90 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-base-300/90 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg transition-transform ${isCollapsed ? "" : "rotate-90"}`}>
                      ▶
                    </span>
                    <h3 className="text-sm font-semibold text-base-content/70">{formatDate(date)}</h3>
                    <span className="badge badge-sm badge-ghost">{groupCount} pembayaran</span>
                  </div>
                </button>

                {!isCollapsed &&
                  groupedPayments[date].map((payment) => (
                    <div key={payment.id} className="card bg-base-100 shadow-sm border border-base-300">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-3">
                              {payment.kindyStudentName}
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">Jumlah:</span>
                                <span className="badge badge-success badge-sm font-semibold">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">Tanggal:</span>
                                <span className="text-xs text-base-content/70">
                                  {formatDate(payment.date)}
                                </span>
                              </div>
                              {payment.reference && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-base-content/60 font-medium">Ref:</span>
                                  <span className="text-xs text-base-content/70">
                                    {payment.reference}
                                  </span>
                                </div>
                              )}
                              {payment.invoiceName && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-base-content/60 font-medium">Tagihan:</span>
                                  <span className="badge badge-primary badge-sm">
                                    📋 {payment.invoiceName}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50 border-t border-base-300 mt-2 pt-2">
                                <span className="font-medium">Dibuat:</span>
                                <span>
                                  {new Date(payment.createdAt).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span>•</span>
                                <span className="font-medium">Diperbarui:</span>
                                <span>
                                  {new Date(payment.updatedAt).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditModal(payment)}
                              className="btn btn-sm btn-ghost btn-square"
                              title="Ubah"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openDeleteModal(payment)}
                              className="btn btn-sm btn-ghost btn-square text-error"
                              title="Hapus"
                            >
                              🗑️
                            </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayment && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Konfirmasi Hapus</h3>
            <p className="mb-4">
              Yakin ingin menghapus pembayaran untuk{" "}
              <strong>{selectedPayment.kindyStudentName}</strong>?
            </p>
            <div className="bg-base-200 p-3 rounded-lg text-sm space-y-1">
              <div>Jumlah: {formatCurrency(selectedPayment.amount)}</div>
              <div>Tanggal: {formatDate(selectedPayment.date)}</div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPayment(null);
                }}
                className="btn btn-ghost"
              >
                Batal
              </button>
              <button onClick={handleDeletePayment} className="btn btn-error">
                Hapus
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
        </dialog>
      )}
    </div>
  );
}
