"use client";

import { useState } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, StatCard } from "@/components/ui";

interface Setor {
  id: string;
  amount: number;
  type: "bank" | "amil";
  no: number;
  createdAt: string;
  updatedAt: string;
}

interface DeltaSetor {
  totalCollected: number;
  totalSetor: number;
  delta: number;
}

interface SetorData {
  setor: Setor[];
  delta: DeltaSetor | null;
}

export default function SetorSection() {
  const { data, isLoading, error, refetch } = useApi<SetorData>(
    async () => {
      const [setorRes, deltaRes] = await Promise.all([
        kindyAdminApi.getSetor(),
        kindyAdminApi.getDeltaSetor(),
      ]);
      return {
        status: "success",
        data: {
          setor: (setorRes.data as Setor[]) || [],
          delta: (deltaRes.data as DeltaSetor) || null,
        },
      };
    },
    { fallbackMessage: "Gagal memuat data setoran" }
  );

  const setorData = data?.setor ?? [];
  const deltaData = data?.delta ?? null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "bank" as "bank" | "amil",
  });

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({ amount: "", type: "bank" });
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("Masukkan jumlah yang valid");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await kindyAdminApi.addSetor({
        amount: parseFloat(formData.amount),
        type: formData.type,
      });
      await refetch();
      closeModal();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal mencatat setoran. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Kontrol Setoran</h2>
          <button onClick={() => setShowAddModal(true)} className="btn btn-sm btn-primary">
            + Catat
          </button>
        </div>

        {/* Delta Statistics */}
        {deltaData && (
          <div className="space-y-3 mb-6">
            <StatCard
              tone={deltaData.delta > 0 ? "warning" : "neutral"}
              label="Sisa"
              value={formatCurrency(deltaData.delta)}
            />
            <div className="grid grid-cols-2 gap-3">
              <StatCard tone="info" label="Total Terkumpul" value={formatCurrency(deltaData.totalCollected)} />
              <StatCard tone="primary" label="Total Disetor" value={formatCurrency(deltaData.totalSetor)} />
            </div>
          </div>
        )}
      </div>

      {/* Setor List */}
      <div className="space-y-2">
        {setorData.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            Belum ada catatan setoran
          </div>
        ) : (
          setorData.map((setor) => (
            <div key={setor.id} className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`badge badge-sm ${
                      setor.type === "bank" ? "badge-primary" : "badge-secondary"
                    }`}
                  >
                    {setor.type === "bank" ? "🏦 Bank" : "👤 Amil"}
                  </span>
                  <span className="text-xs text-base-content/50">#{setor.no}</span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-base-content/60">Jumlah:</span>
                    <span className="ml-2 font-bold text-success">
                      {formatCurrency(setor.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/50">
                    <span className="font-medium">Dicatat:</span>
                    <span className="ml-1">
                      {new Date(setor.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {setor.createdAt !== setor.updatedAt && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="font-medium">Diperbarui:</span>
                        <span className="ml-1">
                          {new Date(setor.updatedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Setor Modal */}
      {showAddModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Catat Setoran Baru</h3>

            <div className="space-y-4">
              {formError && <ErrorAlert message={formError} />}

              <div>
                <label className="label">
                  <span className="label-text">
                    Jumlah (Rp) <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="100.000"
                  className="input input-bordered w-full"
                  value={
                    formData.amount
                      ? formatCurrency(parseFloat(formData.amount)).replace("Rp", "").trim()
                      : ""
                  }
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, amount: numericValue });
                  }}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">
                    Jenis Setoran <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="type"
                      className="radio radio-primary"
                      checked={formData.type === "bank"}
                      onChange={() => setFormData({ ...formData, type: "bank" })}
                    />
                    <span className="label-text">🏦 Transfer Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="type"
                      className="radio radio-primary"
                      checked={formData.type === "amil"}
                      onChange={() => setFormData({ ...formData, type: "amil" })}
                    />
                    <span className="label-text">👤 Via Amil</span>
                  </label>
                </div>
              </div>

              {deltaData && (
                <div className="alert alert-info text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <div className="font-medium">Saldo Saat Ini</div>
                    <div className="text-xs">
                      Sisa untuk disetor: {formatCurrency(deltaData.delta)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button onClick={closeModal} className="btn btn-ghost" disabled={isSubmitting}>
                Batal
              </button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                Catat
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModal}></div>
        </dialog>
      )}
    </div>
  );
}
