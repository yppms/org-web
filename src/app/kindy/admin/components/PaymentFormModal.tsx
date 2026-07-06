"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { kindyAdminApi } from "@/lib/api";
import type { UnpaidInvoice, AdminPayment, AdminStudent, PaymentFormData } from "@/lib/types";

interface PaymentFormModalProps {
  mode: 'add' | 'edit' | null;
  payment: AdminPayment | null;
  students: AdminStudent[];
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

export default function PaymentFormModal({ mode, payment, students, onClose, onSubmit }: PaymentFormModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    studentId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reference: "",
    invoiceId: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editModeStudentId, setEditModeStudentId] = useState<string>("");
  const [shouldFetchInvoices, setShouldFetchInvoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingBalance, setSavingBalance] = useState<number | null>(null);
  const [loadingSavingBalance, setLoadingSavingBalance] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (mode === 'edit' && payment) {
      // Find student ID by name (for edit mode to fetch invoices)
      const student = students.find(s => s.name === payment.kindyStudentName);
      const studentId = student?.id || "";
      setEditModeStudentId(studentId);
      
      setFormData({
        studentId: studentId,
        amount: payment.amount.toString(),
        date: payment.date.split("T")[0],
        reference: payment.reference,
        invoiceId: payment.invoiceId || "",
      });
      setShouldFetchInvoices(false); // Don't auto-fetch in edit mode
    } else if (mode === 'add') {
      setFormData({
        studentId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        reference: "",
        invoiceId: "",
      });
      setStudentSearch("");
      setUnpaidInvoices([]);
      setEditModeStudentId("");
      setShouldFetchInvoices(false);
      setIsSaving(false);
      setSavingBalance(null);
    }
    setFilteredStudents(students);
  }, [mode, payment, students]);

  // Fetch unpaid invoices when student is selected (add mode) or when explicitly requested (edit mode)
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      const studentIdToUse = mode === 'edit' ? editModeStudentId : formData.studentId;
      
      // For add mode: fetch when student is selected
      // For edit mode: only fetch when explicitly requested
      const shouldFetch = mode === 'add' ? !!studentIdToUse : (!!studentIdToUse && shouldFetchInvoices);
      
      if (shouldFetch) {
        setLoadingInvoices(true);
        try {
          const response = await kindyAdminApi.getStudentUnpaidInvoices(studentIdToUse);
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
      } else if (mode === 'add' && !studentIdToUse) {
        setUnpaidInvoices([]);
        setFormData(prev => ({ ...prev, invoiceId: "" }));
      }
    };

    fetchUnpaidInvoices();
  }, [mode, formData.studentId, editModeStudentId, shouldFetchInvoices]);

  // Fetch saving balance whenever a student is selected (add mode)
  useEffect(() => {
    const studentId = mode === 'add' ? formData.studentId : editModeStudentId;
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
  }, [formData.studentId, editModeStudentId, mode]);

  if (!mode) return null;

  const handleStudentSearch = (searchValue: string) => {
    setStudentSearch(searchValue);
    setShowStudentDropdown(true);
    
    if (searchValue.trim() === "") {
      setFilteredStudents(students);
      setFormData({ ...formData, studentId: "" });
    } else {
      const filtered = students.filter((student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase())
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
    if (mode === 'add' && (!formData.studentId || !formData.amount || !formData.date || !formData.reference)) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }
    
    if (mode === 'edit' && (!formData.amount || !formData.date || !formData.reference)) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    await onSubmit({ ...formData, isSaving: isSaving });
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Form Modal */}
      <dialog className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {mode === 'add' ? 'Tambah Pembayaran' : 'Ubah Pembayaran'}
          </h3>
          <div className="space-y-3">
            {mode === 'edit' && payment && (
              <div className="alert alert-info text-sm">
                <span>Mengubah pembayaran untuk: <strong>{payment.kindyStudentName}</strong></span>
              </div>
            )}

            {mode === 'add' && (
              <div className="relative">
                <label className="label">
                  <span className="label-text">Nama Siswa <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
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
                          formData.studentId === student.id ? "bg-primary/10" : ""
                        }`}
                      >
                        {student.name}
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch && !formData.studentId && (
                  <div className="label">
                    <span className="label-text-alt text-warning">Pilih siswa dari daftar</span>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="label">
                <span className="label-text">Jumlah (Rp) <span className="text-error">*</span></span>
              </label>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${formData.amount === '300000' ? 'btn-primary' : 'btn-active'}`}
                  onClick={() => setFormData({ ...formData, amount: '300000' })}
                >
                  Reguler 300K
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
                <span className="label-text">Tanggal <span className="text-error">*</span></span>
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
                <span className="label-text">Referensi <span className="text-error">*</span></span>
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

            {/* Optional Invoice Attachment - Show in both Add and Edit mode */}
            {formData.studentId && (
              <div>
                <label className="label">
                  <span className="label-text">Lampirkan ke Tagihan (Opsional)</span>
                </label>

                {mode === 'edit' && payment?.invoiceName && !shouldFetchInvoices ? (
                  // In edit mode, show current invoice with option to change
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                      <div className="badge badge-primary badge-sm">📋</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{payment.invoiceName}</div>
                        <div className="text-xs text-base-content/60">Tagihan terlampir saat ini</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost btn-block"
                      onClick={() => setShouldFetchInvoices(true)}
                    >
                      Ubah atau Hapus Tagihan
                    </button>
                  </div>
                ) : loadingInvoices ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-base-200 rounded-lg">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-sm text-base-content/60">Memuat tagihan...</span>
                  </div>
                ) : (mode === 'add' || shouldFetchInvoices) && unpaidInvoices.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="select select-bordered w-full"
                      value={formData.invoiceId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiceId: e.target.value })
                      }
                    >
                      <option value="">-- Tanpa tagihan --</option>
                      {unpaidInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.name} | {formatCurrency(invoice.outstanding)} | {invoice.daysLate} hari
                        </option>
                      ))}
                    </select>
                    {mode === 'edit' && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          setShouldFetchInvoices(false);
                          setFormData({ ...formData, invoiceId: payment?.invoiceId || "" });
                        }}
                      >
                        ← Batal
                      </button>
                    )}
                  </div>
                ) : (mode === 'add' || shouldFetchInvoices) ? (
                  <div className="space-y-2">
                    <div className="alert alert-sm text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>Tidak ada tagihan belum lunas untuk siswa ini</span>
                    </div>
                    {mode === 'edit' && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          setShouldFetchInvoices(false);
                          setFormData({ ...formData, invoiceId: payment?.invoiceId || "" });
                        }}
                      >
                        ← Batal
                      </button>
                    )}
                  </div>
                ) : mode === 'edit' && !payment?.invoiceName ? (
                  // Edit mode, no current invoice, not fetching yet
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-block"
                    onClick={() => setShouldFetchInvoices(true)}
                  >
                    + Lampirkan ke Tagihan
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Pay from savings toggle — add mode only */}
          {mode === 'add' && (
            <div className={`mt-4 rounded-lg border p-3 transition-colors ${isSaving ? 'border-primary bg-primary/5' : 'border-base-300'}`}>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium">Bayar dari Tabungan?</span>
                  {formData.studentId && (
                    <div className="text-xs text-base-content/60 mt-0.5">
                      {loadingSavingBalance ? (
                        <span className="loading loading-dots loading-xs" />
                      ) : savingBalance !== null ? (
                        <span>Saldo: <strong>{formatCurrency(savingBalance)}</strong></span>
                      ) : (
                        <span>Gagal memuat saldo</span>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={isSaving}
                  onChange={(e) => setIsSaving(e.target.checked)}
                />
              </label>
              {isSaving && savingBalance !== null && formData.amount && parseFloat(formData.amount) > savingBalance && (
                <div className="alert alert-error p-2 text-xs mt-2">
                  <span>Saldo tidak cukup. Dibutuhkan {formatCurrency(parseFloat(formData.amount))}, tersedia {formatCurrency(savingBalance)}.</span>
                </div>
              )}
            </div>
          )}

          <div className="modal-action">
            <button onClick={onClose} className="btn btn-ghost">
              Batal
            </button>
            <button onClick={openConfirmModal} className="btn btn-primary">
              Lanjut →
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
              Konfirmasi {mode === 'add' ? 'Pembayaran Baru' : 'Perubahan'}
            </h3>

            <div className="alert alert-warning mb-4 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Periksa kembali informasi dengan teliti sebelum melanjutkan</span>
            </div>

            <div className="bg-base-200 rounded-lg p-4 space-y-3">
              {/* Student Name */}
              {mode === 'add' && (
                <div>
                  <div className="text-xs text-base-content/60 font-medium mb-1">Siswa</div>
                  <div className="text-base font-semibold">
                    {students.find(s => s.id === formData.studentId)?.name || 'Tidak diketahui'}
                  </div>
                </div>
              )}

              {mode === 'edit' && payment && (
                <div>
                  <div className="text-xs text-base-content/60 font-medium mb-1">Siswa</div>
                  <div className="text-base font-semibold">{payment.kindyStudentName}</div>
                </div>
              )}

              {/* Amount */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-2">Jumlah Pembayaran</div>
                <div className="badge badge-success badge-lg font-bold text-lg px-4 py-4">
                  {formatCurrency(parseFloat(formData.amount || '0'))}
                </div>
              </div>

              {/* Date */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-1">Tanggal Pembayaran</div>
                <div className="text-sm font-medium">{formatDate(formData.date)}</div>
              </div>

              {/* Reference */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-1">Nomor Referensi</div>
                <div className="text-sm font-mono bg-base-300/50 px-2 py-1 rounded">
                  {formData.reference}
                </div>
              </div>

              {/* Attached Invoice (if selected) */}
              {formData.invoiceId && (
                <div className="border-t border-base-300 pt-3">
                  <div className="text-xs text-base-content/60 font-medium mb-1">Dilampirkan ke Tagihan</div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-1">📋</div>
                    <div>
                      <div className="text-sm font-semibold">
                        {unpaidInvoices.find(inv => inv.id === formData.invoiceId)?.name ||
                         payment?.invoiceName ||
                         'Tagihan tidak diketahui'}
                      </div>
                      {unpaidInvoices.find(inv => inv.id === formData.invoiceId) && (
                        <div className="text-xs text-base-content/60">
                          Tunggakan: {formatCurrency(unpaidInvoices.find(inv => inv.id === formData.invoiceId)?.outstanding || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Savings deduction notice */}
              {isSaving && (
                <div className="border-t border-base-300 pt-3">
                  <div className="alert alert-warning p-2 text-xs">
                    <span>💰 Pembayaran akan dipotong dari <strong>tabungan siswa</strong>{savingBalance !== null ? ` (saldo: ${formatCurrency(savingBalance)})` : ''}.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost"
              >
                ← Kembali
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
              >
                {mode === 'add' ? 'Konfirmasi & Tambah' : 'Konfirmasi & Simpan'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}></div>
        </dialog>
      )}
    </>
  );
}
