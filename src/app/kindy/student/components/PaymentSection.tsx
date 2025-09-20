'use client';

import { useEffect, useState } from 'react';
import { Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import kindyStudentApi, { ApiError } from '@/lib/api';

export default function PaymentSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await kindyStudentApi.getPayments();
        setPayments(response.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Gagal memuat pembayaran');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pembayaran</h2>
        <div className="badge badge-outline text-base-content text-xs rounded-full">
          {payments.length} pembayaran
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60 font-medium">Belum ada riwayat pembayaran</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Card View for All Screen Sizes */}
          <div className="space-y-4">
            {payments
              .sort((a, b) => b.no - a.no) // Sort by payment number in descending order (highest first)
              .map((payment) => (
              <div key={payment.id} className="card bg-base-100 border-2">
                <div className="card-body p-0">
                  {/* Header */}
                  <div className="flex justify-between items-center px-4 py-3 bg-base-200/30 border-b-2 border-base-300/50 text-xs">
                    <span className="font-medium text-base-content/60">{payment.no}</span>
                    <span className="font-medium text-base-content/60">{formatDate(payment.date)}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">pembayaran-{payment.no}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-base-content/60">Jumlah</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center gap-2 px-4 py-3 bg-base-200/30 border-t-2 border-base-300/50">
                    <span className="text-xs text-base-content/50">#{payment.id.toString().toUpperCase()}</span>
                    <div className="flex gap-2">
                      {payment.reference && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full  italic text-base-content">
                          {payment.reference}
                        </span>
                      )}
                      <span className="badge bg-success text-white border-0 text-xs rounded-full">Sukses</span>
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
