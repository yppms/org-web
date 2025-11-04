"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { kindyAdminApi } from "@/lib/api";
import type { UnpaidInvoice } from "@/lib/types";

interface Payment {
  id: string;
  kindyStudentName: string;
  amount: number;
  date: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: string;
  name: string;
}

interface PaymentFormData {
  student_id: string;
  amount: string;
  date: string;
  reference: string;
  invoice_id?: string;
}

interface PaymentFormModalProps {
  mode: 'add' | 'edit' | null;
  payment: Payment | null;
  students: Student[];
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export default function PaymentFormModal({ mode, payment, students, onClose, onSubmit }: PaymentFormModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    invoice_id: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (mode === 'edit' && payment) {
      setFormData({
        student_id: "",
        amount: payment.amount.toString(),
        date: payment.date.split("T")[0],
        reference: payment.reference,
        invoice_id: "",
      });
    } else if (mode === 'add') {
      setFormData({
        student_id: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
        invoice_id: "",
      });
      setStudentSearch("");
      setUnpaidInvoices([]);
    }
    setFilteredStudents(students);
  }, [mode, payment, students]);

  // Fetch unpaid invoices when student is selected
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      if (mode === 'add' && formData.student_id) {
        setLoadingInvoices(true);
        try {
          const response = await kindyAdminApi.getStudentUnpaidInvoices(formData.student_id);
          if (response.status === 'success' && response.data) {
            setUnpaidInvoices(response.data);
          } else {
            setUnpaidInvoices([]);
          }
        } catch (error) {
          console.error('Failed to fetch unpaid invoices:', error);
          setUnpaidInvoices([]);
        } finally {
          setLoadingInvoices(false);
        }
      } else {
        setUnpaidInvoices([]);
        setFormData(prev => ({ ...prev, invoice_id: "" }));
      }
    };

    fetchUnpaidInvoices();
  }, [mode, formData.student_id]);

  if (!mode) return null;

  const handleStudentSearch = (searchValue: string) => {
    setStudentSearch(searchValue);
    setShowStudentDropdown(true);
    
    if (searchValue.trim() === "") {
      setFilteredStudents(students);
      setFormData({ ...formData, student_id: "" });
    } else {
      const filtered = students.filter((student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setFormData({ ...formData, student_id: student.id });
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
  };

  const openConfirmModal = () => {
    // Validate all required fields
    if (mode === 'add' && (!formData.student_id || !formData.amount || !formData.date || !formData.reference)) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (mode === 'edit' && (!formData.amount || !formData.date || !formData.reference)) {
      alert("Please fill in all required fields");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Form Modal */}
      <dialog className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {mode === 'add' ? 'Add New Payment' : 'Edit Payment'}
          </h3>
          <div className="space-y-3">
            {mode === 'edit' && payment && (
              <div className="alert alert-info text-sm">
                <span>Editing payment for: <strong>{payment.kindyStudentName}</strong></span>
              </div>
            )}
            
            {mode === 'add' && (
              <div className="relative">
                <label className="label">
                  <span className="label-text">Student Name <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="Search student name..."
                  className="input input-bordered w-full"
                  value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  onFocus={() => setShowStudentDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowStudentDropdown(false), 200);
                  }}
                />
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-base-100 border border-base-300 rounded-lg shadow-lg">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleStudentSelect(student);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-base-200 ${
                          formData.student_id === student.id ? "bg-primary/10" : ""
                        }`}
                      >
                        {student.name}
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch && !formData.student_id && (
                  <div className="label">
                    <span className="label-text-alt text-warning">Please select a student from the list</span>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="label">
                <span className="label-text">Amount (Rp) <span className="text-error">*</span></span>
              </label>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${formData.amount === '300000' ? 'btn-primary' : 'btn-active'}`}
                  onClick={() => setFormData({ ...formData, amount: '300000' })}
                >
                  Regular 300K
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${formData.amount === '600000' ? 'btn-primary' : 'btn-active'}`}
                  onClick={() => setFormData({ ...formData, amount: '600000' })}
                >
                  Full Day 600K
                </button>
              </div>
              
              <input
                type="text"
                placeholder="40.000"
                className="input input-bordered w-full"
                value={
                  formData.amount
                    ? formatCurrency(parseFloat(formData.amount)).replace('Rp', '').trim()
                    : ''
                }
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, amount: numericValue });
                }}
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Date <span className="text-error">*</span></span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Reference <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
              />
            </div>

            {/* Optional Invoice Attachment - Only in Add mode */}
            {mode === 'add' && formData.student_id && (
              <div>
                <label className="label">
                  <span className="label-text">Attach to Invoice (Optional)</span>
                </label>
                {loadingInvoices ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-base-200 rounded-lg">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-sm text-base-content/60">Loading invoices...</span>
                  </div>
                ) : unpaidInvoices.length > 0 ? (
                  <select
                    className="select select-bordered w-full"
                    value={formData.invoice_id || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_id: e.target.value })
                    }
                  >
                    <option value="">-- No invoice attachment --</option>
                    {unpaidInvoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.name} | {formatCurrency(invoice.outstanding)} | {invoice.daysLate} hari
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="alert alert-sm text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>No unpaid invoices available for this student</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-action">
            <button onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={openConfirmModal} className="btn btn-primary">
              Continue →
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </dialog>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">✓</span>
              Confirm {mode === 'add' ? 'New Payment' : 'Changes'}
            </h3>
            
            <div className="alert alert-warning mb-4 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Please review the information carefully before proceeding</span>
            </div>

            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              {/* Student Name */}
              {mode === 'add' && (
                <div>
                  <div className="text-xs text-base-content/60 font-medium mb-1">Student</div>
                  <div className="text-base font-semibold">
                    {students.find(s => s.id === formData.student_id)?.name || 'Unknown'}
                  </div>
                </div>
              )}
              
              {mode === 'edit' && payment && (
                <div>
                  <div className="text-xs text-base-content/60 font-medium mb-1">Student</div>
                  <div className="text-base font-semibold">{payment.kindyStudentName}</div>
                </div>
              )}

              {/* Amount */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-2">Payment Amount</div>
                <div className="badge badge-success badge-lg font-bold text-lg px-4 py-4">
                  {formatCurrency(parseFloat(formData.amount || '0'))}
                </div>
              </div>

              {/* Date */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-1">Payment Date</div>
                <div className="text-sm font-medium">{formatDate(formData.date)}</div>
              </div>

              {/* Reference */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-1">Reference Number</div>
                <div className="text-sm font-mono bg-base-300/50 px-2 py-1 rounded">
                  {formData.reference}
                </div>
              </div>

              {/* Attached Invoice (if selected) */}
              {mode === 'add' && formData.invoice_id && (
                <div className="border-t border-base-300 pt-3">
                  <div className="text-xs text-base-content/60 font-medium mb-1">Attached to Invoice</div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-1">📋</div>
                    <div>
                      <div className="text-sm font-semibold">
                        {unpaidInvoices.find(inv => inv.id === formData.invoice_id)?.name || 'Unknown Invoice'}
                      </div>
                      <div className="text-xs text-base-content/60">
                        Outstanding: {formatCurrency(unpaidInvoices.find(inv => inv.id === formData.invoice_id)?.outstanding || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost"
              >
                ← Go Back
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary"
              >
                {mode === 'add' ? 'Confirm & Add Payment' : 'Confirm & Save Changes'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}></div>
        </dialog>
      )}
    </>
  );
}
