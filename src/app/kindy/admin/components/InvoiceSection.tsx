"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceFormModal from "./InvoiceFormModal";

interface Invoice {
  id: string;
  kindyStudentName: string;
  name: string;
  amountFull: number;
  discount: number;
  amount: number;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceFormData {
  student_id: string;
  name: string;
  amount: string;
  discount: string;
  start_date: string;
  due_date: string;
}

interface Student {
  id: string;
  name: string;
}

export default function InvoiceSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "date">(
    "createdAt"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    try {
      const response = await kindyAdminApi.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getInvoices();
      setInvoices(response.data || []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchInvoices();
  }, []);

  const handleFormSubmit = async (formData: InvoiceFormData) => {
    try {
      if (formMode === "add") {
        await kindyAdminApi.addInvoice({
          student_id: formData.student_id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          discount: parseFloat(formData.discount),
          start_date: formData.start_date,
          due_date: formData.due_date,
        });
      } else if (formMode === "edit" && selectedInvoice) {
        await kindyAdminApi.updateInvoice(selectedInvoice.id, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          discount: parseFloat(formData.discount),
          start_date: formData.start_date,
          end_date: formData.due_date,
        });
      }
      await fetchInvoices();
      setFormMode(null);
      setSelectedInvoice(null);
    } catch (error) {
      console.error(`Failed to ${formMode} invoice:`, error);
      alert(`Failed to ${formMode} invoice. Please try again.`);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      await kindyAdminApi.deleteInvoice(selectedInvoice.id);
      await fetchInvoices();
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormMode("edit");
  };

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const toggleGroup = (date: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Filter invoices by search query - memoized for performance
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    
    const query = searchQuery.toLowerCase();
    return invoices.filter((invoice) =>
      invoice.kindyStudentName.toLowerCase().includes(query) ||
      invoice.name.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);

  // Group invoices by selected date field - memoized for performance
  const groupedInvoices = useMemo(() => {
    return filteredInvoices.reduce((groups, invoice) => {
      // Get the date field based on sort selection
      let dateValue: string;
      if (sortBy === "createdAt") {
        dateValue = invoice.createdAt;
      } else if (sortBy === "updatedAt") {
        dateValue = invoice.updatedAt;
      } else {
        dateValue = invoice.startDate;
      }

      const date = new Date(dateValue).toISOString().split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(invoice);
      return groups;
    }, {} as Record<string, Invoice[]>);
  }, [filteredInvoices, sortBy]);

  // Sort dates in descending order (newest first) - memoized for performance
  const sortedDates = useMemo(() => {
    return Object.keys(groupedInvoices).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedInvoices]);

  const collapseAll = () => {
    setCollapsedGroups(new Set(sortedDates));
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Custom Invoices</h2>
          <button
            onClick={() => setFormMode("add")}
            className="btn btn-sm btn-primary"
          >
            + Add Invoice
          </button>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          Create and manage custom billing invoices for students
        </p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by student name or invoice name..."
          className="input input-bordered input-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-base-content/70 font-medium">
            Sort by:
          </span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${
                sortBy === "createdAt" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setSortBy("createdAt")}
            >
              Created
            </button>
            <button
              className={`btn btn-xs ${
                sortBy === "updatedAt" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setSortBy("updatedAt")}
            >
              Updated
            </button>
            <button
              className={`btn btn-xs ${
                sortBy === "date" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setSortBy("date")}
            >
              Period Start
            </button>
          </div>
        </div>

        {/* Collapse/Expand controls */}
        {invoices.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={collapseAll}
              className="btn btn-xs btn-ghost"
              title="Collapse all groups"
            >
              📁 Collapse All
            </button>
            <button
              onClick={expandAll}
              className="btn btn-xs btn-ghost"
              title="Expand all groups"
            >
              📂 Expand All
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            No custom invoices yet
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            No invoices found matching "{searchQuery}"
          </div>
        ) : (
          sortedDates.map((date) => {
            const isCollapsed = collapsedGroups.has(date);
            const groupCount = groupedInvoices[date].length;

            return (
              <div key={date} className="space-y-3">
                {/* Collapsible Date header */}
                <button
                  onClick={() => toggleGroup(date)}
                  className="w-full sticky top-0 bg-base-200/90 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-base-300/90 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg transition-transform ${
                        isCollapsed ? "" : "rotate-90"
                      }`}
                    >
                      ▶
                    </span>
                    <h3 className="text-sm font-semibold text-base-content/70">
                      {formatDate(date)}
                    </h3>
                    <span className="badge badge-sm badge-ghost">
                      {groupCount} {groupCount === 1 ? "invoice" : "invoices"}
                    </span>
                  </div>
                  <span className="text-xs text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCollapsed ? "Click to expand" : "Click to collapse"}
                  </span>
                </button>

                {/* Invoices for this date */}
                {!isCollapsed &&
                  groupedInvoices[date].map((invoice) => (
                    <div
                      key={invoice.id}
                      className="card bg-base-100 shadow-sm border border-base-300"
                    >
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            {/* Student Name - Main heading */}
                            <h3 className="font-semibold text-base mb-1">
                              {invoice.kindyStudentName}
                            </h3>

                            {/* Invoice Name - Subtitle */}
                            <p className="text-sm text-base-content/60 mb-3">
                              {invoice.name}
                            </p>

                            <div className="space-y-2">
                              {/* Amount breakdown */}
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">
                                  Amount:
                                </span>
                                <span className="badge badge-warning badge-sm font-medium">
                                  {formatCurrency(invoice.amountFull)}
                                </span>
                                {invoice.discount > 0 && (
                                  <>
                                    <span className="text-base-content/40">
                                      −
                                    </span>
                                    <span className="badge badge-sm bg-red-100 text-red-700 border-red-200 font-medium">
                                      {formatCurrency(invoice.discount)}
                                    </span>
                                    <span className="text-base-content/40">
                                      =
                                    </span>
                                  </>
                                )}
                                <span className="badge badge-success badge-sm font-semibold">
                                  {formatCurrency(invoice.amount)}
                                </span>
                              </div>

                              {/* Period */}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-base-content/60 font-medium">
                                  Period:
                                </span>
                                <span className="text-xs text-base-content/70">
                                  {formatDate(invoice.startDate)}
                                </span>
                                <span className="text-base-content/40">•</span>
                                <span className="text-xs text-base-content/70">
                                  {formatDate(invoice.dueDate)}
                                </span>
                              </div>

                              {/* Timestamps */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50 border-t border-base-300 mt-2 pt-2">
                                <span className="font-medium">Created:</span>
                                <span>
                                  {new Date(invoice.createdAt).toLocaleString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                                <span>•</span>
                                <span className="font-medium">Updated:</span>
                                <span>
                                  {new Date(invoice.updatedAt).toLocaleString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditModal(invoice)}
                              className="btn btn-sm btn-ghost btn-square"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openDeleteModal(invoice)}
                              className="btn btn-sm btn-ghost btn-square text-error"
                              title="Delete"
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
            <h3 className="font-bold text-lg mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this invoice for{" "}
              <strong>{selectedInvoice.kindyStudentName}</strong>?
            </p>
            <div className="bg-base-200 p-3 rounded-lg text-sm space-y-1">
              <div>Invoice: {selectedInvoice.name}</div>
              <div>Amount: {formatCurrency(selectedInvoice.amountFull)}</div>
              {selectedInvoice.discount > 0 && (
                <div>Discount: {formatCurrency(selectedInvoice.discount)}</div>
              )}
              <div>Final: {formatCurrency(selectedInvoice.amount)}</div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleDeleteInvoice} className="btn btn-error">
                Delete
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowDeleteModal(false)}
          ></div>
        </dialog>
      )}
    </div>
  );
}
