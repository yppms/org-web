"use client";

import { useState, useMemo } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminInvoice, AdminStudent, InvoiceFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
  Input,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui";
import { cn } from "@/lib/utils";
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
  const { data: studentsData } = useApi<AdminStudent[]>(() =>
    kindyAdminApi.getAllStudents(),
  );

  const invoices = useMemo(() => invoicesData ?? [], [invoicesData]);
  const students = studentsData ?? [];

  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(
    null,
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [sortBy] = useState<"createdAt" | "updatedAt" | "date">("createdAt");
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
        err instanceof ApiError
          ? err.message
          : "Gagal menyimpan tagihan. Coba lagi.",
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
        err instanceof ApiError
          ? err.message
          : "Gagal menghapus tagihan. Coba lagi.",
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
        invoice.name.toLowerCase().includes(query),
    );
  }, [invoices, searchQuery]);

  const groupedInvoices = useMemo(() => {
    return filteredInvoices.reduce(
      (groups, invoice) => {
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
      },
      {} as Record<string, AdminInvoice[]>,
    );
  }, [filteredInvoices, sortBy]);

  const sortedDates = useMemo(
    () =>
      Object.keys(groupedInvoices).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      ),
    [groupedInvoices],
  );

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tagihan Khusus</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Buat dan kelola tagihan khusus untuk siswa
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => setFormMode("add")}
        >
          + Tambah
        </Button>
      </div>

      {actionError && <ErrorAlert message={actionError} />}

      <Input
        type="text"
        placeholder="Cari nama siswa atau nama tagihan…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex flex-col gap-4">
        {invoices.length === 0 ? (
          <EmptyState message="Belum ada tagihan khusus" />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            message={`Tidak ada tagihan dengan kata kunci "${searchQuery}"`}
          />
        ) : (
          sortedDates.map((date) => {
            const isCollapsed = collapsedGroups.has(date);
            const groupCount = groupedInvoices[date].length;

            return (
              <div key={date} className="flex flex-col gap-2">
                <button
                  onClick={() => toggleGroup(date)}
                  className="flex w-full items-center gap-2 py-1"
                >
                  <span
                    className={cn(
                      "transition-transform",
                      !isCollapsed && "rotate-90",
                    )}
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

                {!isCollapsed &&
                  groupedInvoices[date].map((invoice) => (
                    <div
                      key={invoice.id}
                      className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {invoice.kindyStudentName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {invoice.name} · {formatDate(invoice.startDate)} –{" "}
                            {formatDate(invoice.dueDate)}
                          </p>
                          {invoice.discount > 0 && (
                            <span className="mt-1.5 inline-block rounded-md bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                              Diskon {formatCurrency(invoice.discount)}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="text-sm font-semibold font-mono">
                            {formatCurrency(invoice.amount)}
                          </span>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => openEditModal(invoice)}
                            >
                              Ubah
                            </Button>
                            <Button
                              variant="ghost-destructive"
                              size="xs"
                              onClick={() => openDeleteModal(invoice)}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteModal(false);
            setSelectedInvoice(null);
          }
        }}
      >
        {selectedInvoice && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Data untuk{" "}
                <strong className="text-foreground">
                  {selectedInvoice.kindyStudentName}
                </strong>{" "}
                akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-mono font-medium">
                  {formatCurrency(selectedInvoice.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">
                  {formatDate(selectedInvoice.startDate)}
                </span>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteInvoice}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
