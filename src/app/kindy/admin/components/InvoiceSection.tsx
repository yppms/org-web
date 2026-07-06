"use client";

import { useState, useMemo } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminInvoice, AdminStudent, InvoiceFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert } from "@/components/ui";
import InvoiceFormModal from "./InvoiceFormModal";

export default function InvoiceSection() {
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useApi<AdminInvoice[]>(() => kindyAdminApi.getInvoices(), {
    fallbackMessage: "Gagal memuat tagihan",
  });
  const { data: studentsData } = useApi<AdminStudent[]>(() => kindyAdminApi.getAllStudents());

  const invoices = useMemo(() => invoicesData ?? [], [invoicesData]);
  const students = studentsData ?? [];

  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "date">("createdAt");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: InvoiceFormData) => {
    setActionError(null);
    try {
      if (formMode === "add") {
        await kindyAdminApi.addInvoice({
          studentId: formData.studentId,
          name: formData.name,
          amount: parseFloat(formData.amount),
          discount: parseFloat(formData.discount),
          startDate: formData.startDate,
          dueDate: formData.dueDate,
        });
      } else if (formMode === "edit" && selectedInvoice) {
        await kindyAdminApi.updateInvoice(selectedInvoice.id, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          discount: parseFloat(formData.discount),
          startDate: formData.startDate,
          dueDate: formData.dueDate,
        });
      }
      await refetch();
      setFormMode(null);
      setSelectedInvoice(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menyimpan tagihan. Coba lagi."
      );
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    setActionError(null);
    try {
      await kindyAdminApi.deleteInvoice(selectedInvoice.id);
      await refetch();
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menghapus tagihan. Coba lagi."
      );
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice);
    setFormMode("edit");
  };

  const openDeleteModal = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice);
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

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.kindyStudentName.toLowerCase().includes(query) ||
        invoice.name.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);

  const groupedInvoices = useMemo(() => {
    return filteredInvoices.reduce((groups, invoice) => {
      const dateValue =
        sortBy === "createdAt"
          ? invoice.createdAt
          : sortBy === "updatedAt"
          ? invoice.updatedAt
          : invoice.startDate;
      const date = new Date(dateValue).toISOString().split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(invoice);
      return groups;
    }, {} as Record<string, AdminInvoice[]>);
  }, [filteredInvoices, sortBy]);

  const sortedDates = useMemo(
    () => Object.keys(groupedInvoices).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedInvoices]
  );

  const collapseAll = () => setCollapsedGroups(new Set(sortedDates));
  const expandAll = () => setCollapsedGroups(new Set());

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Tagihan Khusus</h2>
          <button onClick={() => setFormMode("add")} className="btn btn-sm btn-primary">
            + Tambah
          </button>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          Buat dan kelola tagihan khusus untuk siswa
        </p>

        {actionError && (
          <div className="mb-4">
            <ErrorAlert message={actionError} />
          </div>
        )}

        <input
          type="text"
          placeholder="Cari nama siswa atau nama tagihan..."
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
              Awal Periode
            </button>
          </div>
        </div>

        {invoices.length > 0 && (
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
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">Belum ada tagihan khusus</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            Tidak ada tagihan dengan kata kunci &quot;{searchQuery}&quot;
          </div>
        ) : (
          sortedDates.map((date) => {
            const isCollapsed = collapsedGroups.has(date);
            const groupCount = groupedInvoices[date].length;

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
                    <span className="badge badge-sm badge-ghost">{groupCount} tagihan</span>
                  </div>
                </button>

                {!isCollapsed &&
                  groupedInvoices[date].map((invoice) => (
                    <div key={invoice.id} className="card bg-base-100 shadow-sm border border-base-300">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">
                              {invoice.kindyStudentName}
                            </h3>
                            <p className="text-sm text-base-content/60 mb-3">{invoice.name}</p>

                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">Jumlah:</span>
                                <span className="badge badge-warning badge-sm font-medium">
                                  {formatCurrency(invoice.amountFull)}
                                </span>
                                {invoice.discount > 0 && (
                                  <>
                                    <span className="text-base-content/40">−</span>
                                    <span className="badge badge-error badge-outline badge-sm font-medium">
                                      {formatCurrency(invoice.discount)}
                                    </span>
                                    <span className="text-base-content/40">=</span>
                                  </>
                                )}
                                <span className="badge badge-success badge-sm font-semibold">
                                  {formatCurrency(invoice.amount)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">Periode:</span>
                                <span className="text-xs text-base-content/70">
                                  {formatDate(invoice.startDate)}
                                </span>
                                <span className="text-base-content/40">•</span>
                                <span className="text-xs text-base-content/70">
                                  {formatDate(invoice.dueDate)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50 border-t border-base-300 mt-2 pt-2">
                                <span className="font-medium">Dibuat:</span>
                                <span>
                                  {new Date(invoice.createdAt).toLocaleString("en-GB", {
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
                                  {new Date(invoice.updatedAt).toLocaleString("en-GB", {
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
                              onClick={() => openEditModal(invoice)}
                              className="btn btn-sm btn-ghost btn-square"
                              title="Ubah"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openDeleteModal(invoice)}
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

      {/* Invoice Form Modal (Add/Edit) */}
      <InvoiceFormModal
        mode={formMode}
        invoice={selectedInvoice}
        students={students}
        onClose={() => {
          setFormMode(null);
          setSelectedInvoice(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInvoice && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Konfirmasi Hapus</h3>
            <p className="mb-4">
              Yakin ingin menghapus tagihan untuk{" "}
              <strong>{selectedInvoice.kindyStudentName}</strong>?
            </p>
            <div className="bg-base-200 p-3 rounded-lg text-sm space-y-1">
              <div>Tagihan: {selectedInvoice.name}</div>
              <div>Jumlah: {formatCurrency(selectedInvoice.amountFull)}</div>
              {selectedInvoice.discount > 0 && (
                <div>Diskon: {formatCurrency(selectedInvoice.discount)}</div>
              )}
              <div>Total: {formatCurrency(selectedInvoice.amount)}</div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
                }}
                className="btn btn-ghost"
              >
                Batal
              </button>
              <button onClick={handleDeleteInvoice} className="btn btn-error">
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
