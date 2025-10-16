"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import PaymentFormModal from "./PaymentFormModal";

interface Payment {
  id: string;
  kindyStudentName: string;
  amount: number;
  date: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentFormData {
  student_id: string;
  amount: string;
  date: string;
  reference: string;
}

interface Student {
  id: string;
  name: string;
}

export default function PaymentSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'date'>('createdAt');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    try {
      const response = await kindyAdminApi.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getPayments();
      setPayments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchPayments();
  }, []);

  const handleFormSubmit = async (formData: PaymentFormData) => {
    try {
      if (formMode === 'add') {
        await kindyAdminApi.addPayment({
          student_id: formData.student_id,
          amount: parseFloat(formData.amount),
          date: formData.date,
          reference: formData.reference,
        });
      } else if (formMode === 'edit' && selectedPayment) {
        await kindyAdminApi.updatePayment(selectedPayment.id, {
          amount: parseFloat(formData.amount),
          date: formData.date,
          reference: formData.reference,
        });
      }
      await fetchPayments();
      setFormMode(null);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Failed to save payment:", error);
      alert("Failed to save payment. Please try again.");
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    try {
      await kindyAdminApi.deletePayment(selectedPayment.id);
      await fetchPayments();
      setShowDeleteModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Failed to delete payment:", error);
    }
  };

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormMode('edit');
  };

  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
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

  // Filter payments by search query - memoized for performance
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    
    const query = searchQuery.toLowerCase();
    return payments.filter((payment) =>
      payment.kindyStudentName.toLowerCase().includes(query) ||
      payment.reference.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  // Group payments by selected date field - memoized for performance
  const groupedPayments = useMemo(() => {
    return filteredPayments.reduce((groups, payment) => {
      // Get the date field based on sort selection
      let dateValue: string;
      if (sortBy === 'createdAt') {
        dateValue = payment.createdAt;
      } else if (sortBy === 'updatedAt') {
        dateValue = payment.updatedAt;
      } else {
        dateValue = payment.date;
      }
      
      const date = new Date(dateValue).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(payment);
      return groups;
    }, {} as Record<string, Payment[]>);
  }, [filteredPayments, sortBy]);

  // Sort dates in descending order (newest first) - memoized for performance
  const sortedDates = useMemo(() => {
    return Object.keys(groupedPayments).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedPayments]);

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
          <h2 className="text-lg font-semibold">Payment Records</h2>
          <button
            onClick={() => setFormMode('add')}
            className="btn btn-sm btn-primary"
          >
            + Add Payment
          </button>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          Track all student payment transactions
        </p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by student name or reference..."
          className="input input-bordered input-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-base-content/70 font-medium">Sort by:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === 'createdAt' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSortBy('createdAt')}
            >
              Created
            </button>
            <button
              className={`btn btn-xs ${sortBy === 'updatedAt' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSortBy('updatedAt')}
            >
              Updated
            </button>
            <button
              className={`btn btn-xs ${sortBy === 'date' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSortBy('date')}
            >
              Payment Date
            </button>
          </div>
        </div>
        
        {/* Collapse/Expand controls */}
        {payments.length > 0 && (
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
        {payments.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            No payment records yet
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            No payments found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          sortedDates.map((date) => {
            const isCollapsed = collapsedGroups.has(date);
            const groupCount = groupedPayments[date].length;
            
            return (
              <div key={date} className="space-y-3">
                {/* Collapsible Date header */}
                <button
                  onClick={() => toggleGroup(date)}
                  className="w-full sticky top-0 bg-base-200/90 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-base-300/90 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                      ▶
                    </span>
                    <h3 className="text-sm font-semibold text-base-content/70">
                      {formatDate(date)}
                    </h3>
                    <span className="badge badge-sm badge-ghost">
                      {groupCount} {groupCount === 1 ? 'payment' : 'payments'}
                    </span>
                  </div>
                  <span className="text-xs text-base-content/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCollapsed ? 'Click to expand' : 'Click to collapse'}
                  </span>
                </button>
                
                {/* Payments for this date */}
                {!isCollapsed && groupedPayments[date].map((payment) => (
                <div key={payment.id} className="card bg-base-100 shadow-sm border border-base-300">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Student Name - Main heading */}
                        <h3 className="font-semibold text-base mb-3">{payment.kindyStudentName}</h3>
                        
                        <div className="space-y-2">
                          {/* Amount */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-base-content/60 font-medium">Amount:</span>
                            <span className="badge badge-success badge-sm font-semibold">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          
                          {/* Payment Date */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-base-content/60 font-medium">Date:</span>
                            <span className="text-xs text-base-content/70">
                              {formatDate(payment.date)}
                            </span>
                          </div>
                          
                          {/* Reference */}
                          {payment.reference && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-base-content/60 font-medium">Ref:</span>
                              <span className="text-xs text-base-content/70">
                                {payment.reference}
                              </span>
                            </div>
                          )}
                          
                          {/* Timestamps */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50 border-t border-base-300 mt-2 pt-2">
                            <span className="font-medium">Created:</span>
                            <span>{new Date(payment.createdAt).toLocaleString('en-GB', { 
                              day: '2-digit', month: 'short', year: '2-digit', 
                              hour: '2-digit', minute: '2-digit' 
                            })}</span>
                            <span>•</span>
                            <span className="font-medium">Updated:</span>
                            <span>{new Date(payment.updatedAt).toLocaleString('en-GB', { 
                              day: '2-digit', month: 'short', year: '2-digit', 
                              hour: '2-digit', minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditModal(payment)}
                          className="btn btn-sm btn-ghost btn-square"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteModal(payment)}
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
            <h3 className="font-bold text-lg mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete this payment record for{" "}
              <strong>{selectedPayment.kindyStudentName}</strong>?
            </p>
            <div className="bg-base-200 p-3 rounded-lg text-sm space-y-1">
              <div>Amount: {formatCurrency(selectedPayment.amount)}</div>
              <div>Date: {formatDate(selectedPayment.date)}</div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPayment(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleDeletePayment} className="btn btn-error">
                Delete
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
        </dialog>
      )}
    </div>
  );
}
