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
  Badge,
  SectionHeader,
  Card,
} from "@/components/ui";
import ListControls, { useSort } from "@/components/ListControls";

type SortKey = "name" | "outstanding" | "totalInvoice";
type FilterType = "all" | "outstanding" | "overpaid" | "settled";

export default function OutstandingSection() {
  const { data, isLoading, error } = useApi<StudentOutstanding[]>(
    () => kindyAdminApi.getAllOutstanding(),
    { fallbackMessage: "Gagal memuat data tunggakan" },
  );
  const outstandingData = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const { sortBy, order, toggle, signed } = useSort<SortKey>("outstanding");
  const [filterType, setFilterType] = useState<FilterType>("all");

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
    else if (filterType === "settled")
      filtered = filtered.filter((s) => s.outstanding === 0);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return signed(a.name.localeCompare(b.name));
        case "outstanding":
          return signed(a.outstanding - b.outstanding);
        case "totalInvoice":
          return signed(a.totalInvoice - b.totalInvoice);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outstandingData, searchQuery, sortBy, order, filterType]);

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

      <ListControls
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama siswa…",
        }}
        filter={{
          options: [
            { key: "all", label: "Semua" },
            { key: "outstanding", label: "Tunggakan" },
            { key: "overpaid", label: "Lebih bayar" },
            { key: "settled", label: "Lunas" },
          ],
          value: filterType,
          onChange: setFilterType,
        }}
        sort={{
          options: [
            { key: "outstanding", label: "Selisih" },
            { key: "totalInvoice", label: "Tagihan" },
            { key: "name", label: "Nama" },
          ],
          value: sortBy,
          order,
          onChange: toggle,
        }}
      />

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
