"use client";

import { useEffect, useState } from "react";
import { Infaq } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi, { ApiError } from "@/lib/api";

interface InfaqSectionProps {}

export default function InfaqSection() {
  const [infaq, setInfaq] = useState<Infaq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfaq = async () => {
      try {
        const response = await kindyStudentApi.getInfaq();
        setInfaq(response.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memuat data infaq");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfaq();
  }, []);

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Infaq</h2>
        <div className="badge badge-outline text-base-content text-xs rounded-full">
          {infaq.length} infaq
        </div>
      </div>

      {/* Infaq List */}
      {infaq.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center">
            <p className="text-base-content/70">Tidak ada data</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Card View for All Screen Sizes */}
          <div className="space-y-4">
            {infaq
              .sort((a, b) => b.no - a.no) // Sort by infaq number in descending order (highest first)
              .map((item) => (
                <div
                  key={item.id}
                  className="card bg-base-100 border-2"
                >
                  <div className="card-body p-0">
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 bg-base-200/30 border-b-2 border-base-300/50 text-xs">
                      <span className="font-medium text-base-content/60">
                        {item.no}
                      </span>
                      <span className="font-medium text-base-content/60">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">
                          infaq-{formatDate(item.date)}
                        </span>
                        <span className="text-lg">🤲</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-base-content/60">Jumlah</span>
                        <span className="font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
                      <span className="text-xs text-base-content/50">
                        #{item.id.toString().toUpperCase()}
                      </span>
                      <div className="flex gap-2">
                        {item.reference && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full italic text-base-content">
                            {item.reference}
                          </span>
                        )}
                        <span className="badge bg-success text-white border-0 text-xs rounded-full">
                          Berhasil
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
