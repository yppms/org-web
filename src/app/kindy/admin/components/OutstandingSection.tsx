"use client";

import { useMemo, useState } from "react";
import { kindyAdminApi } from "@/lib/api";
import { StudentOutstanding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, StatCard } from "@/components/ui";

type SortKey = "no" | "name" | "outstanding" | "totalInvoice";

export default function OutstandingSection() {
  const { data, isLoading, error } = useApi<StudentOutstanding[]>(
    () => kindyAdminApi.getAllOutstanding(),
    { fallbackMessage: "Gagal memuat data tunggakan" }
  );
  const outstandingData = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("outstanding");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "outstanding" | "overpaid">("all");

  const filteredAndSorted = useMemo(() => {
    let filtered = outstandingData;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = outstandingData.filter((s) => s.name.toLowerCase().includes(query));
    }

    if (filterType === "outstanding") filtered = filtered.filter((s) => s.outstanding > 0);
    else if (filterType === "overpaid") filtered = filtered.filter((s) => s.outstanding < 0);

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "no":
          comparison = a.no - b.no;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "outstanding":
          comparison = a.outstanding - b.outstanding;
          break;
        case "totalInvoice":
          comparison = a.totalInvoice - b.totalInvoice;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [outstandingData, searchQuery, sortBy, sortOrder, filterType]);

  const toggleSort = (field: SortKey) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const arrow = (key: SortKey) =>
    sortBy === key ? (sortOrder === "desc" ? " ↓" : " ↑") : "";

  const totalOutstanding = outstandingData.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);
  const totalOverpaid = Math.abs(outstandingData.reduce((sum, s) => sum + (s.outstanding < 0 ? s.outstanding : 0), 0));
  const studentsWithOutstanding = outstandingData.filter((s) => s.outstanding > 0).length;
  const studentsOverpaid = outstandingData.filter((s) => s.outstanding < 0).length;
  const totalInvoice = outstandingData.reduce((sum, s) => sum + s.totalInvoice, 0);
  const totalPayment = outstandingData.reduce((sum, s) => sum + s.totalPayment, 0);

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-3">Tunggakan Siswa</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Saldo tunggakan pembayaran siswa, diurutkan dari yang terbesar
        </p>

        <input
          type="text"
          placeholder="Cari nama siswa..."
          className="input input-bordered input-sm w-full mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            tone="error"
            label="Total Tunggakan"
            value={formatCurrency(totalOutstanding)}
            hint={`${studentsWithOutstanding} siswa`}
          />
          <StatCard
            tone="info"
            label="Lebih Bayar"
            value={formatCurrency(totalOverpaid)}
            hint={`${studentsOverpaid} siswa`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Total Tagihan" value={formatCurrency(totalInvoice)} />
          <StatCard label="Total Pembayaran" value={formatCurrency(totalPayment)} />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterType("all")}
          >
            Semua ({outstandingData.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === "outstanding" ? "btn-error" : "btn-ghost"}`}
            onClick={() => setFilterType("outstanding")}
          >
            Tunggakan ({studentsWithOutstanding})
          </button>
          <button
            className={`btn btn-sm ${filterType === "overpaid" ? "btn-info" : "btn-ghost"}`}
            onClick={() => setFilterType("overpaid")}
          >
            Lebih Bayar ({studentsOverpaid})
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-base-content/70 font-medium">Urutkan:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "outstanding" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("outstanding")}
            >
              Tunggakan{arrow("outstanding")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "totalInvoice" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("totalInvoice")}
            >
              Tagihan{arrow("totalInvoice")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("name")}
            >
              Nama{arrow("name")}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery
              ? `Tidak ada siswa dengan nama "${searchQuery}"`
              : "Tidak ada data tunggakan"}
          </div>
        ) : (
          filteredAndSorted.map((student) => (
            <div
              key={student.id}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                student.outstanding > 0
                  ? "border-error/30 hover:border-error/50"
                  : student.outstanding < 0
                  ? "border-info/30 hover:border-info/50"
                  : "border-base-300 hover:border-base-300"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-base truncate">{student.name}</h3>
                  {student.outstanding > 0 && (
                    <span className="badge badge-error badge-sm flex-shrink-0 whitespace-nowrap">
                      Belum Lunas
                    </span>
                  )}
                  {student.outstanding < 0 && (
                    <span className="badge badge-info badge-sm flex-shrink-0 whitespace-nowrap">
                      Lebih Bayar
                    </span>
                  )}
                  {student.outstanding === 0 && (
                    <span className="badge badge-success badge-sm flex-shrink-0 whitespace-nowrap">
                      Lunas
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-base-content/60">Tagihan:</span>
                    <span className="ml-2 font-semibold">{formatCurrency(student.totalInvoice)}</span>
                    <span className="ml-1 text-sm font-bold text-base-content">
                      ({student.invoiceCount})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-base-content/60">Pembayaran:</span>
                    <span className="ml-2 font-semibold">{formatCurrency(student.totalPayment)}</span>
                    <span className="ml-1 text-sm font-bold text-base-content">
                      ({student.paymentCount})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-base-content/60">Tunggakan:</span>
                    <span
                      className={`ml-2 font-bold text-base ${
                        student.outstanding > 0
                          ? "text-error"
                          : student.outstanding < 0
                          ? "text-info"
                          : "text-success"
                      }`}
                    >
                      {student.outstanding < 0 ? "+" : ""}
                      {formatCurrency(Math.abs(student.outstanding))}
                    </span>
                  </div>

                  {student.unpaidInvoiceCount && student.unpaidInvoice && student.unpaidInvoice.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-base-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-base-content/70">
                          Tagihan Belum Lunas:
                        </span>
                        <span className="badge badge-error badge-sm font-bold">
                          {student.unpaidInvoiceCount}
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        {student.unpaidInvoice.map((inv, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm gap-3">
                            <div className="truncate text-base-content/80 flex-1">{inv.name}</div>
                            <div className="font-semibold text-error whitespace-nowrap">
                              {formatCurrency(inv.outstanding)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredAndSorted.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Menampilkan {filteredAndSorted.length} dari {outstandingData.length} siswa
        </div>
      )}
    </div>
  );
}
