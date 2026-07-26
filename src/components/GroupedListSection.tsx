"use client";

import { useMemo, useState } from "react";
import { ApiResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import {
  Spinner,
  ErrorAlert,
  StatCard,
  SectionHeader,
  Card,
} from "@/components/ui";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";

/** Normalised row shape every grouped list works with. */
export interface GroupedListItem {
  id: string;
  name: string;
  class: string | null;
  total: number;
  count: number;
  last: string | null;
  no: number;
}

interface GroupedListLabels {
  totalStat: string; // e.g. "Total Tabungan"
  activeStat: string; // e.g. "Penabung Aktif"
  amountSort: string; // e.g. "Jumlah"
  lastSort: string; // e.g. "Transaksi Terakhir"
  balanceRow: string; // e.g. "Saldo:"
  countRow: string; // e.g. "Transaksi:"
  emptyItem: string; // e.g. "Belum menabung"
  noData: string; // e.g. "Tidak ada data tabungan"
}

interface GroupedListSectionProps<T> {
  title: string;
  subtitle: string;
  fetcher: () => Promise<ApiResponse<T[]>>;
  mapItem: (raw: T) => GroupedListItem;
  fallbackMessage: string;
  labels: GroupedListLabels;
  /** Hide the search box (e.g. the Infaq view in the mockup). */
  showSearch?: boolean;
}

/**
 * Per-class grouped student list with overall stats, class filter chips,
 * optional search, and a single card of rows. Shared by the admin Savings and
 * Infaq sections.
 */
export default function GroupedListSection<T>({
  title,
  subtitle,
  fetcher,
  mapItem,
  fallbackMessage,
  labels,
  showSearch = true,
}: GroupedListSectionProps<T>) {
  const { data, isLoading, error } = useApi<T[]>(fetcher, { fallbackMessage });
  const items = useMemo(() => (data ?? []).map(mapItem), [data, mapItem]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (selectedClass) list = list.filter((s) => s.class === selectedClass);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    // Contributors first, then most-recent, then name.
    return [...list].sort((a, b) => {
      if (a.total === 0 && b.total > 0) return 1;
      if (a.total > 0 && b.total === 0) return -1;
      const at = a.last ? new Date(a.last).getTime() : 0;
      const bt = b.last ? new Date(b.last).getTime() : 0;
      if (bt !== at) return bt - at;
      return a.name.localeCompare(b.name);
    });
  }, [items, searchQuery, selectedClass]);

  const total = items.reduce((sum, s) => sum + s.total, 0);
  const activeCount = items.filter((s) => s.total > 0).length;

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title={title} subtitle={subtitle} />

      {/* Overall statistics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          tone="primary"
          label={labels.totalStat}
          value={formatCurrency(total)}
        />
        <StatCard
          tone="neutral"
          label={labels.activeStat}
          value={`${activeCount} / ${items.length}`}
        />
      </div>

      {/* Class filter chips */}
      {classes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={selectedClass === null}
            onClick={() => setSelectedClass(null)}
          >
            Semua
          </Chip>
          {classes.map((cls) => (
            <Chip
              key={cls}
              active={selectedClass === cls}
              onClick={() =>
                setSelectedClass(selectedClass === cls ? null : cls)
              }
            >
              {cls}
            </Chip>
          ))}
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <Input
          type="text"
          placeholder="Cari nama siswa…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {/* Student list */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted-foreground">
          {searchQuery
            ? `Tidak ada siswa dengan nama "${searchQuery}"`
            : labels.noData}
        </div>
      ) : (
        <Card className="px-4">
          {filtered.map((student) => {
            const parts = [
              student.class,
              student.total > 0
                ? `${student.count} transaksi`
                : labels.emptyItem,
              student.last ? `terakhir ${formatDate(student.last)}` : null,
            ].filter(Boolean);
            return (
              <div
                key={student.id}
                className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{student.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {parts.join(" · ")}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono text-[13px] font-semibold ${
                    student.total > 0
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(student.total)}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {items.length} siswa
        </p>
      )}
    </div>
  );
}
