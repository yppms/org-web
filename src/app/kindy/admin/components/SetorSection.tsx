"use client";

import { useState, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Setor {
  id: string;
  amount: number;
  type: 'bank' | 'amil';
  no: number;
  createdAt: string;
  updatedAt: string;
}

interface DeltaSetor {
  totalCollected: number;
  totalSetor: number;
  delta: number;
}

export default function SetorSection() {
  const [setorData, setSetorData] = useState<Setor[]>([]);
  const [deltaData, setDeltaData] = useState<DeltaSetor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "bank" as "bank" | "amil",
  });

  const fetchSetor = async () => {
    setLoading(true);
    try {
      const [setorResponse, deltaResponse] = await Promise.all([
        kindyAdminApi.getSetor(),
        kindyAdminApi.getDeltaSetor(),
      ]);
      setSetorData(setorResponse.data || []);
      setDeltaData(deltaResponse.data || null);
    } catch (error) {
      console.error("Failed to fetch setor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetor();
  }, []);

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await kindyAdminApi.addSetor({
        amount: parseFloat(formData.amount),
        type: formData.type,
      });
      await fetchSetor();
      setShowAddModal(false);
      setFormData({ amount: "", type: "bank" });
    } catch (error) {
      console.error("Failed to add setor:", error);
      alert("Failed to record. Please try again.");
    }
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
          <h2 className="text-lg font-semibold">IS Ctrl</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-sm btn-primary"
          >
            + Record
          </button>
        </div>

        {/* Delta Statistics */}
        {deltaData && (
          <div className="space-y-3 mb-6">
            {/* Remaining Delta - Full Width */}
            <div className={`card bg-gradient-to-br ${
              deltaData.delta > 0 
                ? 'from-orange-500/10 to-orange-600/5 border-orange-500/20' 
                : 'from-gray-500/10 to-gray-600/5 border-gray-500/20'
            } border`}>
              <div className="card-body p-4">
                <div className="text-xs text-base-content/60">Remaining</div>
                <div className={`text-2xl font-bold ${deltaData.delta > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {formatCurrency(deltaData.delta)}
                </div>
              </div>
            </div>

            {/* Collected and Deposited - Two Columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="card-body p-4">
                  <div className="text-xs text-base-content/60">Total Collected</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(deltaData.totalCollected)}
                  </div>
                </div>
              </div>
              <div className="card bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="card-body p-4">
                  <div className="text-xs text-base-content/60">Total Deposited</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(deltaData.totalSetor)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setor List */}
      <div className="space-y-2">
        {setorData.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            No deposit records yet
          </div>
        ) : (
          setorData.map((setor) => (
            <div key={setor.id} className="card bg-base-100 shadow-sm border border-base-300 hover:border-base-300">
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${
                        setor.type === 'bank' ? 'badge-primary' : 'badge-secondary'
                      } badge-sm`}>
                        {setor.type === 'bank' ? '🏦 Bank' : '👤 Amil'}
                      </span>
                      <span className="text-xs text-base-content/50">#{setor.no}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Amount */}
                      <div className="text-sm">
                        <span className="text-base-content/60">Amount:</span>
                        <span className="ml-2 font-bold text-success">
                          {formatCurrency(setor.amount)}
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-base-content/50">
                        <span className="font-medium">Recorded:</span>
                        <span className="ml-1">
                          {new Date(setor.createdAt).toLocaleString('en-GB', { 
                            day: '2-digit', month: 'short', year: '2-digit', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        {setor.createdAt !== setor.updatedAt && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="font-medium">Updated:</span>
                            <span className="ml-1">
                              {new Date(setor.updatedAt).toLocaleString('en-GB', { 
                                day: '2-digit', month: 'short', year: '2-digit', 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
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
            <h3 className="font-bold text-lg mb-4">Record New</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Amount (Rp) <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="100.000"
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
                  <span className="label-text">Deposit Type <span className="text-error">*</span></span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="type"
                      className="radio radio-primary"
                      checked={formData.type === 'bank'}
                      onChange={() => setFormData({ ...formData, type: 'bank' })}
                    />
                    <span className="label-text">🏦 Bank Transfer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="type"
                      className="radio radio-primary"
                      checked={formData.type === 'amil'}
                      onChange={() => setFormData({ ...formData, type: 'amil' })}
                    />
                    <span className="label-text">👤 Via Amil</span>
                  </label>
                </div>
              </div>

              {deltaData && (
                <div className="alert alert-info text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div>
                    <div className="font-medium">Current Balance</div>
                    <div className="text-xs">Remaining to deposit: {formatCurrency(deltaData.delta)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ amount: "", type: "bank" });
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                Record
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop" 
            onClick={() => {
              setShowAddModal(false);
              setFormData({ amount: "", type: "bank" });
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
}
