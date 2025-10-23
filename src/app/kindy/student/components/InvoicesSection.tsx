"use client";

import { useEffect, useState } from "react";
import { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi, { ApiError } from "@/lib/api";

export default function InvoicesSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await kindyStudentApi.getInvoices();
        setInvoices(response.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Gagal memuat data tagihan");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      issued: {
        icon: "⏳",
        text: "Terbit",
        color: "text-warning",
      },
      paid: {
        icon: "✓",
        text: "Lunas",
        color: "text-success",
      },
      partial: {
        icon: "◐",
        text: "Sebagian",
        color: "text-orange-500",
      },
      overdue: {
        icon: "⚠",
        text: "Terlambat",
        color: "text-error",
      },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      icon: "•",
      text: status,
      color: "text-base-content",
    };

    return (
      <span className={`text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.icon} {statusInfo.text}
      </span>
    );
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Tagihan</h2>
        <div className="badge badge-outline text-base-content text-xs rounded-full">
          {invoices.length} tagihan
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center">
            <p className="text-base-content/70">Tidak ada data</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Card View for All Screen Sizes */}
          <div className="space-y-4">
            {invoices
              .sort((a, b) => b.no - a.no) // Sort by invoice number in descending order (highest first)
              .map((invoice) => (
                <div key={invoice.id} className="card bg-base-100 border-2">
                  <div className="card-body p-0">
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 bg-base-200/30 border-b-2 border-base-300/50 text-xs">
                      <span className="font-medium text-base-content/60">
                        {invoice.no}
                      </span>
                      <span className="font-medium text-base-content/60">
                        {formatDate(invoice.startDate)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-3 px-4 py-3">
                      <div className="font-bold text-base">{invoice.name}</div>
                      <div className="space-y-2 text-xs">
                        {invoice.discount > 0 ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-base-content/60">
                                Jumlah
                              </span>
                              <span className="font-medium">
                                {formatCurrency(invoice.amountFull)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-base-content/60">
                                Diskon
                              </span>
                              <span className="font-medium text-orange-500">
                                {formatCurrency(invoice.discount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-base-content/60 font-medium">
                                Total
                              </span>
                              <span className="font-bold underline decoration-2 underline-offset-4">
                                {formatCurrency(invoice.amount)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-base-content/60 font-medium">Total</span>
                            <span className="font-bold underline decoration-2 underline-offset-4">
                              {formatCurrency(invoice.amount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">Terbayar</span>
                          <span className="font-semibold">
                            {formatCurrency(invoice.paid)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">
                            Belum Terbayar
                          </span>
                          <span
                            className={`font-bold ${
                              invoice.outstanding > 0
                                ? "text-error"
                                : "text-error"
                            }`}
                          >
                            {formatCurrency(invoice.outstanding)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">
                            Jatuh Tempo
                          </span>
                          <span className="font-medium">
                            {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
                      <span className="text-xs text-base-content/50">
                        #{invoice.id.toString().toUpperCase()}
                      </span>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(invoice.status)}
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
