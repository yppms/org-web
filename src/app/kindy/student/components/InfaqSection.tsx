"use client";

import { Infaq } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, EmptyState } from "@/components/ui";
import ActivityRow from "./ActivityRow";

export default function InfaqSection() {
  const { data, isLoading, error } = useApi<Infaq[]>(
    () => kindyStudentApi.getInfaq(),
    { fallbackMessage: "Gagal memuat data infaq" }
  );
  const infaq = data ?? [];

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;
  if (infaq.length === 0) return <EmptyState />;

  return (
    <div>
      {[...infaq]
        // Most recent activity first. `no` is only the backend's row order,
        // which drifts from the real chronology once records are backfilled.
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            b.no - a.no,
        )
        .map((item) => (
          <ActivityRow
            key={item.id}
            title={item.reference || "Infaq"}
            date={formatDate(item.date)}
            amount={formatCurrency(item.amount)}
            badge="Sukses"
            badgeVariant="default"
          />
        ))}
    </div>
  );
}
