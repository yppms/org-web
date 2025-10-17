"use client";

import { useEffect, useState } from "react";
import { Saving, StudentStats } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi, { ApiError } from "@/lib/api";

interface SavingsSectionProps {
  stats: StudentStats;
  onStatsUpdate: (stats: StudentStats) => void;
}

export default function SavingsSection({
  stats,
  onStatsUpdate,
}: SavingsSectionProps) {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const response = await kindyStudentApi.getSavings();
        setSavings(response.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load savings");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavings();
  }, []);

  const getStatusBadge = (status: string, type: string) => {
    if (status === "SUCCESS") {
      return (
        <span className="text-xs font-semibold text-success">
          ✓ Sukses
        </span>
      );
    } else if (status === "REQUEST") {
      return (
        <span className="text-xs font-semibold text-warning">
          ⏳ Request
        </span>
      );
    } else {
      return (
        <span className="text-xs font-semibold text-error">
          ✗ Gagal
        </span>
      );
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "SAVE" ? "💰" : "💸";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Tabungan</h2>
          <div className="badge badge-outline text-base-content text-xs rounded-full">
            {savings.length} transaksi
          </div>
        </div>

        {/* Savings List */}
        {savings.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <p className="text-base-content/70">Tidak ada data</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Card View for All Screen Sizes */}
            <div className="space-y-4">
              {savings
                .sort((a, b) => b.no - a.no) // Sort by saving number in descending order (highest first)
                .map((saving) => (
                  <div key={saving.id} className="card bg-base-100 border-2">
                    <div className="card-body p-0">
                      {/* Header */}
                      <div className="flex justify-between items-center px-4 py-3 bg-base-200/30 border-b-2 border-base-300/50 text-xs">
                        <span className="font-medium text-base-content/60">
                          {saving.no}
                        </span>
                        <span className="font-medium text-base-content/60">
                          {formatDate(saving.date)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-3 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">
                            {saving.type === 'SAVE' ? `nabung-${formatDate(saving.date)}` : 'tarik'}
                          </span>
                          <span>{getTypeIcon(saving.type)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-base-content/60 font-medium">Jumlah</span>
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-success/30 to-green-600/30 rounded-lg blur-md"></div>
                            <span className="relative text-xs font-extrabold text-white bg-gradient-to-br from-success via-green-600 to-green-700 px-2 py-2 rounded-md">
                              {formatCurrency(saving.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
                        <span className="text-xs text-base-content/50">
                          #{saving.id.toString().toUpperCase()}
                        </span>
                        <div className="flex gap-2 items-center">
                          {saving.reference && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full  italic text-base-content">
                              {saving.reference}
                            </span>
                          )}
                          {getStatusBadge(saving.status, saving.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
