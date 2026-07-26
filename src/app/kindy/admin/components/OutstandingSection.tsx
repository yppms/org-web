"use client";

import { useMemo, useState } from "react";
import { kindyAdminApi } from "@/lib/api";
import { StudentOutstanding } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  StatCard,
  Input,
  Chip,
  Badge,
  SectionHeader,
  Card,
} from "@/components/ui";

type SortKey = "no" | "name" | "outstanding" | "totalInvoice";

export default function OutstandingSection() {
  const { data, isLoading, error } = useApi<StudentOutstanding[]>(
    () => kindyAdminApi.getAllOutstanding(),
    { fallbackMessage: "Gagal memuat data tunggakan" },
  );
  const outstandingData = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("outstanding");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<
    "all" | "outstanding" | "overpaid"
  >("all");

  const filteredAndSorted = useMemo(() => {
    let filtered = outstandingData;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = outstandingData.filter((s) =>
        s.name.toLowerCase().includes(query),
      );
    }

    if (filterType === "outstanding")
      filtered = filtered.filter((s) => s.outstanding > 0);
    else if (filterType === "overpaid")
      filtered = filtered.filter((s) => s.outstanding < 0);

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

  const totalOutstanding = outstandingData.reduce(
    (sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0),
    0,
  );
  const totalOverpaid = Math.abs(
    outstandingData.reduce(
      (sum, s) => sum + (s.outstanding < 0 ? s.outstanding : 0),
      0,
    ),
  );
  const studentsWithOutstanding = outstandingData.filter(
    (s) => s.outstanding > 0,
  ).length;
  const studentsOverpaid = outstandingData.filter(
    (s) => s.outstanding < 0,
  ).length;

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Tunggakan"
        subtitle="Saldo tunggakan pembayaran siswa"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          tone="error"
          label="Total tunggakan"
          value={formatCurrency(totalOutstanding)}
          hint={`${studentsWithOutstanding} siswa`}
        />
        <StatCard
          tone="info"
          label="Lebih bayar"
          value={formatCurrency(totalOverpaid)}
          hint={`${studentsOverpaid} siswa`}
        />
      </div>

      <Input
        type="text"
        placeholder="Cari nama siswa…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex gap-1.5 flex-wrap">
        <Chip
          active={filterType === "all"}
          onClick={() => setFilterType("all")}
        >
          Semua
        </Chip>
        <Chip
          active={filterType === "outstanding"}
          onClick={() => setFilterType("outstanding")}
        >
          Tunggakan
        </Chip>
        <Chip
          active={filterType === "overpaid"}
          onClick={() => setFilterType("overpaid")}
        >
          Lebih bayar
        </Chip>
      </div>

      <div className="flex flex-col gap-2">
        {filteredAndSorted.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {searchQuery
              ? `Tidak ada siswa dengan nama "${searchQuery}"`
              : "Tidak ada data tunggakan"}
          </p>
        ) : (
          filteredAndSorted.map((student) => (
            <Card key={student.id} className="px-4 py-3.5">
              <div className="flex justify-between items-start gap-2 mb-2">
                <p className="min-w-0 text-sm font-semibold">{student.name}</p>
                {student.outstanding > 0 ? (
                  <Badge variant="destructive">Tertunggak</Badge>
                ) : student.outstanding < 0 ? (
                  <Badge variant="info">Lebih bayar</Badge>
                ) : (
                  <Badge variant="default">Lunas</Badge>
                )}
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                <span>
                  Tagihan{" "}
                  <strong className="text-foreground font-mono">
                    {formatCurrency(student.totalInvoice)}
                  </strong>
                </span>
                <span>
                  Bayar{" "}
                  <strong className="text-foreground font-mono">
                    {formatCurrency(student.totalPayment)}
                  </strong>
                </span>
                <span>
                  Selisih{" "}
                  <strong
                    className={`font-mono ${
                      student.outstanding > 0
                        ? "text-destructive"
                        : student.outstanding < 0
                          ? "text-info"
                          : "text-foreground"
                    }`}
                  >
                    {student.outstanding > 0
                      ? "−"
                      : student.outstanding < 0
                        ? "+"
                        : ""}
                    {formatCurrency(Math.abs(student.outstanding))}
                  </strong>
                </span>
              </div>

              {student.unpaidInvoiceCount &&
                student.unpaidInvoice &&
                student.unpaidInvoice.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-border flex flex-col gap-1.5">
                    {student.unpaidInvoice.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between gap-3 text-[13px]"
                      >
                        <span className="min-w-0 text-muted-foreground">
                          {inv.name}
                        </span>
                        <span className="font-mono text-destructive whitespace-nowrap">
                          {formatCurrency(inv.outstanding)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          ))
        )}
      </div>

      {filteredAndSorted.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan {filteredAndSorted.length} dari {outstandingData.length}{" "}
          siswa
        </p>
      )}
    </div>
  );
}
