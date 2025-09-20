'use client';

import { useEffect, useState } from 'react';
import { Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import kindyStudentApi, { ApiError } from '@/lib/api';

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
          setError('Gagal memuat data tagihan');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      issued: { class: 'bg-warning text-white border-0 text-xs rounded-full', text: 'Terbit' },
      paid: { class: 'bg-success text-white border-0 text-xs rounded-full', text: 'Lunas' },
      partial: { class: 'bg-error text-white border-0 text-xs rounded-full', text: 'Sebagian' },
      overdue: { class: 'bg-error text-white border-0 text-xs rounded-full', text: 'Terlambat' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      class: 'bg-base-content text-white border-0 text-xs rounded-full', 
      text: status 
    };

    return (
      <span className={`badge ${statusInfo.class}`}>
        {statusInfo.text}
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
                    <span className="font-medium text-base-content/60">{invoice.no}</span>
                    <span className="font-medium text-base-content/60">{formatDate(invoice.startDate)}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2 px-4 py-3">
                    <div className="font-bold text-base">{invoice.name}</div>
                    <div className="space-y-1 text-xs">
                      {invoice.discount > 0 ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-base-content/60">Jumlah</span>
                            <span className="font-medium">{formatCurrency(invoice.amountFull)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-base-content/60">Diskon</span>
                            <span className="font-medium text-success">{formatCurrency(invoice.discount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-base-content/60">Total</span>
                            <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">Total</span>
                          <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Belum Terbayar</span>
                        <span className={`font-bold ${invoice.outstanding > 0 ? 'text-error' : 'text-success'}`}>
                          {formatCurrency(invoice.outstanding)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Jatuh Tempo</span>
                        <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
                    <span className="text-xs text-base-content/50">#{invoice.id.toString().toUpperCase()}</span>
                    <div className="flex gap-2">
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
