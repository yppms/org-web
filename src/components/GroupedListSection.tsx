"use client";

import { useMemo, useState } from "react";
import { ApiResponse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { Spinner, ErrorAlert, StatCard } from "@/components/ui";

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
}

type SortKey = "no" | "name" | "total" | "last";

/**
 * Per-class grouped student list with overall + per-class stats, class filter,
 * search, and sort. Shared by the admin Savings and Infaq sections, which were
 * previously ~296-line copy-paste twins.
 */
export default function GroupedListSection<T>({
  title,
  subtitle,
  fetcher,
  mapItem,
  fallbackMessage,
  labels,
}: GroupedListSectionProps<T>) {
  const { data, isLoading, error } = useApi<T[]>(fetcher, { fallbackMessage });
  const items = useMemo(() => (data ?? []).map(mapItem), [data, mapItem]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("last");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [items]);

  const classStats = useMemo(
    () =>
      classes.map((cls) => {
        const students = items.filter((s) => s.class === cls);
        return {
          name: cls,
          total: students.reduce((sum, s) => sum + s.total, 0),
          count: students.length,
          active: students.filter((s) => s.total > 0).length,
        };
      }),
    [items, classes]
  );

  const filtered = useMemo(() => {
    let list = items;
    if (selectedClass) list = list.filter((s) => s.class === selectedClass);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "total" || sortBy === "last") {
        if (a.total === 0 && b.total > 0) return 1;
        if (a.total > 0 && b.total === 0) return -1;
        if (a.total === 0 && b.total === 0) return 0;
      }
      let comparison = 0;
      switch (sortBy) {
        case "no":
          comparison = a.no - b.no;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "last":
          if (!a.last && !b.last) comparison = 0;
          else if (!a.last) comparison = 1;
          else if (!b.last) comparison = -1;
          else comparison = new Date(a.last).getTime() - new Date(b.last).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [items, searchQuery, sortBy, sortOrder, selectedClass]);

  const toggleSort = (field: SortKey) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const total = items.reduce((sum, s) => sum + s.total, 0);
  const activeCount = items.filter((s) => s.total > 0).length;
  const arrow = (key: SortKey) =>
    sortBy === key ? (sortOrder === "desc" ? " ↓" : " ↑") : "";

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        <p className="text-sm text-base-content/60 mb-4">{subtitle}</p>

        {/* Overall statistics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard tone="primary" label={labels.totalStat} value={formatCurrency(total)} />
          <StatCard
            tone="info"
            label={labels.activeStat}
            value={`${activeCount} / ${items.length}`}
          />
        </div>

        {/* Per-class stats */}
        {classStats.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
              Per Kelompok
            </div>
            <div className="grid grid-cols-2 gap-2">
              {classStats.map((cs) => (
                <button
                  key={cs.name}
                  onClick={() =>
                    setSelectedClass(selectedClass === cs.name ? null : cs.name)
                  }
                  className={`card text-left transition-all ${
                    selectedClass === cs.name
                      ? "bg-primary/20 border-2 border-primary/60"
                      : "bg-base-100 border border-base-300 hover:border-primary/40"
                  }`}
                >
                  <div className="card-body p-3">
                    <div className="text-xs font-semibold text-base-content/70 mb-1">
                      {cs.name}
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(cs.total)}
                    </div>
                    <div className="text-xs text-base-content/50">
                      {cs.active}/{cs.count} aktif
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Class filter tabs */}
        {classes.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              className={`btn btn-xs ${selectedClass === null ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSelectedClass(null)}
            >
              Semua
            </button>
            {classes.map((cls) => (
              <button
                key={cls}
                className={`btn btn-xs ${selectedClass === cls ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Cari nama siswa..."
          className="input input-bordered input-sm w-full mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Sort controls */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-base-content/70 font-medium">Urutkan:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "total" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("total")}
            >
              {labels.amountSort}
              {arrow("total")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("name")}
            >
              Nama{arrow("name")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "last" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("last")}
            >
              {labels.lastSort}
              {arrow("last")}
            </button>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? `Tidak ada siswa dengan nama "${searchQuery}"` : labels.noData}
          </div>
        ) : (
          filtered.map((student) => (
            <div
              key={student.id}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                student.total > 0
                  ? "border-base-300 hover:border-primary/50"
                  : "border-base-300/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-base">{student.name}</h3>
                  {student.class && (
                    <span className="badge badge-sm badge-ghost">{student.class}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base-content/60">{labels.balanceRow}</span>
                    <span
                      className={`font-bold ${
                        student.total > 0 ? "text-primary" : "text-base-content/40"
                      }`}
                    >
                      {formatCurrency(student.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base-content/60">{labels.countRow}</span>
                    <span className="badge badge-sm badge-outline">{student.count}</span>
                  </div>
                  {student.last && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-base-content/60">Terakhir:</span>
                      <span className="text-xs text-base-content/70">
                        {formatDate(student.last)}
                      </span>
                    </div>
                  )}
                  {student.total === 0 && (
                    <span className="text-xs text-base-content/40 italic">
                      {labels.emptyItem}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Menampilkan {filtered.length} dari {items.length} siswa
        </div>
      )}
    </div>
  );
}
