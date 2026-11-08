"use client";

import { useState, useMemo, useEffect } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { AdminInvoice, AdminStudent, InvoiceFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Button,
  Badge,
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
import { cn } from "@/lib/utils";
import InvoiceFormModal from "./InvoiceFormModal";
import ListControls, { useSort, ViewControls } from "@/components/ListControls";

type InvoiceFilter =
  | "all"
  | "unpaid"
  | "overdue"
  | "paid"
  | "custom"
  | "discount";
type InvoiceSortKey = "name" | "outstanding" | "dueDate" | "createdAt";

const statusMap: Record<
  AdminInvoice["status"],
  { text: string; variant: BadgeProps["variant"] }
> = {
  issued: { text: "Terbit", variant: "warning" },
  paid: { text: "Lunas", variant: "default" },
  partial: { text: "Sebagian", variant: "warning" },
  overdue: { text: "Terlambat", variant: "destructive" },
};

interface StudentGroup {
  name: string;
  invoices: AdminInvoice[];
  outstanding: number;
}

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
  const { sortBy, order, toggle, signed } = useSort<InvoiceSortKey>(
    "name",
    "asc",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  // Groups start closed — forty students' bills is a long page — and open
  // once the admin narrows the list. `toggled` holds the groups the admin
  // flipped away from that default; it resets when the default changes.
  const narrowed = searchQuery.trim() !== "" || filter !== "all";
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  useEffect(() => setToggled(new Set()), [narrowed]);
  const isOpen = (name: string) => narrowed !== toggled.has(name);
  const toggleGroup = (name: string) => {
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const [compact, setCompact] = useState(false);

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

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (filter === "unpaid") list = list.filter((inv) => inv.outstanding > 0);
    else if (filter === "overdue")
      list = list.filter((inv) => inv.status === "overdue");
    else if (filter === "paid") list = list.filter((inv) => inv.outstanding <= 0);
    else if (filter === "custom") list = list.filter((inv) => inv.isCustom);
    else if (filter === "discount") list = list.filter((inv) => inv.discount > 0);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (invoice) =>
        invoice.kindyStudentName.toLowerCase().includes(query) ||
        invoice.name.toLowerCase().includes(query),
    );
  }, [invoices, searchQuery, filter]);

  // One group per student. Bills inside a group follow the date sort when
  // one is active, else latest due date first; the groups follow the active
  // sort — by name, by what the student still owes, or by their newest date.
  const groups = useMemo<StudentGroup[]>(() => {
    const byStudent = new Map<string, AdminInvoice[]>();
    for (const invoice of filteredInvoices) {
      const list = byStudent.get(invoice.kindyStudentName) ?? [];
      list.push(invoice);
      byStudent.set(invoice.kindyStudentName, list);
    }
    const dateKey = sortBy === "dueDate" || sortBy === "createdAt" ? sortBy : "dueDate";
    const time = (inv: AdminInvoice) => new Date(inv[dateKey]).getTime();
    const dateSign = (comparison: number) =>
      sortBy === dateKey ? signed(comparison) : -comparison;

    const result: StudentGroup[] = [];
    for (const [name, list] of byStudent) {
      list.sort((a, b) => dateSign(time(a) - time(b)));
      result.push({
        name,
        invoices: list,
        outstanding: list.reduce((sum, inv) => sum + inv.outstanding, 0),
      });
    }
    result.sort((a, b) => {
      if (sortBy === "name") return signed(a.name.localeCompare(b.name));
      if (sortBy === "outstanding")
        return (
          signed(a.outstanding - b.outstanding) || a.name.localeCompare(b.name)
        );
      const newest = (g: StudentGroup) => Math.max(...g.invoices.map(time));
      return signed(newest(a) - newest(b)) || a.name.localeCompare(b.name);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInvoices, sortBy, order]);

  const studentCount = useMemo(
    () => new Set(invoices.map((inv) => inv.kindyStudentName)).size,
    [invoices],
  );

  // Every group open or closed at once: flip the ones that sit at the
  // default, leave the ones already flipped — see isOpen.
  const allOpen = groups.every((group) => isOpen(group.name));
  const toggleAll = () =>
    setToggled(
      allOpen === narrowed
        ? new Set(groups.map((group) => group.name))
        : new Set(),
    );

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Tagihan"
        subtitle="Semua tagihan siswa, dikelompokkan per anak"
        actions={
          <Button size="sm" onClick={() => setFormMode("add")}>
            + Tambah
          </Button>
        }
      />

      {actionError && <ErrorAlert message={actionError} />}

      <ListControls
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama siswa atau nama tagihan…",
        }}
        filter={{
          options: [
            { key: "all", label: "Semua" },
            { key: "unpaid", label: "Belum lunas" },
            { key: "overdue", label: "Terlambat" },
            { key: "paid", label: "Lunas" },
            { key: "custom", label: "Khusus" },
            { key: "discount", label: "Ada diskon" },
          ],
          value: filter,
          onChange: setFilter,
        }}
        sort={{
          options: [
            { key: "name", label: "Nama" },
            { key: "outstanding", label: "Tunggakan" },
            { key: "dueDate", label: "Jatuh tempo" },
            { key: "createdAt", label: "Dibuat" },
          ],
          value: sortBy,
          order,
          onChange: toggle,
        }}
      />

      {groups.length > 0 && (
        <ViewControls
          allOpen={allOpen}
          onToggleAll={toggleAll}
          compact={compact}
          onToggleCompact={() => setCompact(!compact)}
        />
      )}

      <div className="flex flex-col gap-4">
        {invoices.length === 0 ? (
          <EmptyState message="Belum ada tagihan" />
        ) : groups.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? `Tidak ada tagihan dengan kata kunci "${searchQuery}"`
                : "Tidak ada tagihan untuk filter ini"
            }
          />
        ) : (
          groups.map((group) => {
            const open = isOpen(group.name);
            return (
              <div key={group.name} className="flex flex-col gap-2">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex w-full items-start gap-2 py-1 text-left"
                >
                  <span
                    className={cn(
                      "transition-transform",
                      open && "rotate-90",
                    )}
                  >
                    ▸
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {group.name}
                    <span className="ml-1.5 rounded-md bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
                      {group.invoices.length}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-mono",
                      group.outstanding > 0
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {group.outstanding > 0
                      ? `Kurang ${formatCurrency(group.outstanding)}`
                      : "Lunas"}
                  </span>
                </button>

                {open && compact && (
                  <Card className="px-4">
                    {group.invoices.map((invoice) => {
                      const status = statusMap[invoice.status];
                      return (
                        <div
                          key={invoice.id}
                          className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                            <p className="text-sm font-medium">{invoice.name}</p>
                            <Badge variant={status.variant}>{status.text}</Badge>
                            {invoice.isCustom && (
                              <Badge variant="accent">Khusus</Badge>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="font-mono text-sm font-semibold">
                              {formatCurrency(invoice.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => openEditModal(invoice)}
                            >
                              Ubah
                            </Button>
                            {invoice.isCustom && (
                              <Button
                                variant="ghost-destructive"
                                size="xs"
                                onClick={() => openDeleteModal(invoice)}
                              >
                                Hapus
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}

                {open &&
                  !compact &&
                  group.invoices.map((invoice) => {
                    const status = statusMap[invoice.status];
                    return (
                      <Card key={invoice.id} className="px-4 py-3.5">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="text-sm font-semibold">
                                {invoice.name}
                              </p>
                              <Badge variant={status.variant}>
                                {status.text}
                              </Badge>
                              {invoice.isCustom && (
                                <Badge variant="accent">Khusus</Badge>
                              )}
                              {invoice.supersededById && (
                                <Badge variant="info">Refund</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(invoice.startDate)} –{" "}
                              {formatDate(invoice.dueDate)}
                              {invoice.daysLate > 0 &&
                                ` · ${invoice.daysLate} hari lewat`}
                            </p>
                            {invoice.paid > 0 && invoice.outstanding > 0 && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Terbayar{" "}
                                <span className="font-mono">
                                  {formatCurrency(invoice.paid)}
                                </span>
                                , kurang{" "}
                                <span className="font-mono text-destructive">
                                  {formatCurrency(invoice.outstanding)}
                                </span>
                              </p>
                            )}
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
                              {invoice.isCustom && (
                                <Button
                                  variant="ghost-destructive"
                                  size="xs"
                                  onClick={() => openDeleteModal(invoice)}
                                >
                                  Hapus
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>

      {groups.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan {filteredInvoices.length} dari {invoices.length} tagihan
          · {groups.length} dari {studentCount} siswa
        </p>
      )}

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
              <AlertDialogTitle>Hapus tagihan ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Tagihan{" "}
                <strong className="text-foreground">{selectedInvoice.name}</strong>{" "}
                untuk{" "}
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
