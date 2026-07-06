"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AdminInvoice, AdminStudent, InvoiceFormData } from "@/lib/types";

interface InvoiceFormModalProps {
  mode: 'add' | 'edit' | null;
  invoice: AdminInvoice | null;
  students: AdminStudent[];
  onClose: () => void;
  onSubmit: (formData: InvoiceFormData) => void;
}

export default function InvoiceFormModal({
  mode,
  invoice,
  students,
  onClose,
  onSubmit,
}: InvoiceFormModalProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    studentId: "",
    name: "",
    amount: "",
    discount: "0",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AdminStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        studentId: "",
        name: "",
        amount: "",
        discount: "0",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
      });
      setStudentSearch("");
      setFilteredStudents(students);
    } else if (mode === 'edit' && invoice) {
      setFormData({
        studentId: "", // Cannot edit studentId
        name: invoice.name,
        amount: invoice.amountFull.toString(),
        discount: invoice.discount.toString(),
        startDate: invoice.startDate.split("T")[0],
        dueDate: invoice.dueDate.split("T")[0],
      });
      setStudentSearch("");
      setFilteredStudents(students);
    }
  }, [mode, invoice, students]);

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

  const handleContinue = () => {
    // Validate all required fields before showing confirmation
    if (mode === 'add' && (!formData.studentId || !formData.name || !formData.amount || !formData.discount || !formData.startDate || !formData.dueDate)) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }
    
    if (mode === 'edit' && (!formData.name || !formData.amount || !formData.discount || !formData.startDate || !formData.dueDate)) {
      alert("Lengkapi semua field yang wajib diisi");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    onSubmit(formData);
  };

  const handleClose = () => {
    setShowConfirmModal(false);
    onClose();
  };

  if (!mode) return null;

  return (
    <>
      {/* Main Form Modal */}
      <dialog className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">
            {mode === 'add' ? 'Tambah Tagihan' : 'Ubah Tagihan'}
          </h3>

          <div className="space-y-3">
            {mode === 'edit' && invoice && (
              <div className="alert alert-info text-sm">
                <span>Mengubah tagihan untuk: <strong>{invoice.kindyStudentName}</strong></span>
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
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowStudentDropdown(false), 200);
                  }}
                />
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-base-100 border border-base-300 rounded-lg shadow-lg">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
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
                <span className="label-text">Nama Tagihan <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                placeholder="mis. Biaya Khusus Karyawisata"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <span className="label-text">Jumlah (Rp) <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={
                    formData.amount
                      ? formatCurrency(parseFloat(formData.amount)).replace('Rp', '')
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
                  <span className="label-text">Diskon (Rp) <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={
                    formData.discount
                      ? formatCurrency(parseFloat(formData.discount)).replace('Rp', '')
                      : ''
                  }
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, discount: numericValue });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  <span className="label-text">Tanggal Mulai <span className="text-error">*</span></span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Jatuh Tempo <span className="text-error">*</span></span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button onClick={handleClose} className="btn btn-ghost">
              Batal
            </button>
            <button onClick={handleContinue} className="btn btn-primary">
              Lanjut →
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={handleClose}></div>
      </dialog>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">✓</span>
              Konfirmasi {mode === 'add' ? 'Tagihan Baru' : 'Perubahan'}
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

              {mode === 'edit' && invoice && (
                <div>
                  <div className="text-xs text-base-content/60 font-medium mb-1">Siswa</div>
                  <div className="text-base font-semibold">{invoice.kindyStudentName}</div>
                </div>
              )}

              {/* Invoice Name */}
              <div>
                <div className="text-xs text-base-content/60 font-medium mb-1">Nama Tagihan</div>
                <div className="text-sm">{formData.name}</div>
              </div>

              {/* Amount Details */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-2">Rincian Jumlah</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70">Jumlah Penuh</span>
                    <span className="badge badge-warning font-semibold">
                      {formatCurrency(parseFloat(formData.amount || '0'))}
                    </span>
                  </div>
                  {parseFloat(formData.discount || '0') > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-base-content/70">Diskon</span>
                      <span className="badge badge-error badge-outline font-semibold">
                        − {formatCurrency(parseFloat(formData.discount || '0'))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-base-300">
                    <span className="text-sm font-semibold">Total Akhir</span>
                    <span className="badge badge-success badge-lg font-bold">
                      {formatCurrency(
                        parseFloat(formData.amount || '0') - parseFloat(formData.discount || '0')
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Period */}
              <div className="border-t border-base-300 pt-3">
                <div className="text-xs text-base-content/60 font-medium mb-2">Periode Tagihan</div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-base-content/60 text-xs">Tanggal Mulai</div>
                    <div className="font-medium">{formatDate(formData.startDate)}</div>
                  </div>
                  <div className="text-base-content/40">→</div>
                  <div>
                    <div className="text-base-content/60 text-xs">Jatuh Tempo</div>
                    <div className="font-medium">{formatDate(formData.dueDate)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-ghost"
              >
                ← Kembali
              </button>
              <button
                onClick={handleConfirm}
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
