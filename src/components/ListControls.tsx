"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  LayoutList,
  Rows3,
} from "lucide-react";

export type SortOrder = "asc" | "desc";

export interface ListOption<K extends string> {
  key: K;
  label: string;
}

/**
 * Sort state for a list: the active key and its direction. Tapping the active
 * key flips the direction; tapping another key selects it, descending.
 * `signed` turns a plain ascending comparison into the ordered one.
 */
export function useSort<K extends string>(
  initial: K,
  initialOrder: SortOrder = "desc",
) {
  const [sortBy, setSortBy] = useState<K>(initial);
  const [order, setOrder] = useState<SortOrder>(initialOrder);
  const toggle = (key: K) => {
    if (key === sortBy) setOrder(order === "asc" ? "desc" : "asc");
    else {
      setSortBy(key);
      setOrder("desc");
    }
  };
  const signed = (comparison: number) =>
    order === "asc" ? comparison : -comparison;
  return { sortBy, order, toggle, signed };
}

interface ListControlsProps<F extends string, K extends string> {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  /** Single-choice filter chips; the first option is usually "Semua". */
  filter?: {
    options: ListOption<F>[];
    value: F;
    onChange: (value: F) => void;
  };
  /** Sort chips; the active one carries its direction arrow. */
  sort?: {
    options: ListOption<K>[];
    value: K;
    order: SortOrder;
    onChange: (key: K) => void;
  };
}

/**
 * The search box, filter chips and sort chips every admin list shares, so the
 * tabs read the same way. Each section passes only the parts that make sense
 * for its data.
 */
export default function ListControls<F extends string, K extends string>({
  search,
  filter,
  sort,
}: ListControlsProps<F, K>) {
  return (
    <div className="flex flex-col gap-2.5">
      {search && (
        <Input
          type="text"
          placeholder={search.placeholder}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
        />
      )}
      {filter && (
        <div className="flex flex-wrap gap-1.5">
          {filter.options.map((option) => (
            <Chip
              key={option.key}
              active={filter.value === option.key}
              onClick={() => filter.onChange(option.key)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}
      {sort && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Urutkan</span>
          {sort.options.map((option) => (
            <Chip
              key={option.key}
              active={sort.value === option.key}
              onClick={() => sort.onChange(option.key)}
            >
              {option.label}
              {sort.value === option.key && (sort.order === "desc" ? " ↓" : " ↑")}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

interface ViewControlsProps {
  /** Whether every group is open now; the button offers the opposite. */
  allOpen: boolean;
  onToggleAll: () => void;
  /** Compact: one line per row, no secondary details. */
  compact: boolean;
  onToggleCompact: () => void;
}

/**
 * The two whole-list switches a grouped list gets: open or close every group
 * at once, and compact or full rows. Sits under the chips, right-aligned.
 */
export function ViewControls({
  allOpen,
  onToggleAll,
  compact,
  onToggleCompact,
}: ViewControlsProps) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button variant="outline" size="xs" onClick={onToggleAll}>
        {allOpen ? (
          <ChevronsDownUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5" />
        )}
        {allOpen ? "Tutup semua" : "Buka semua"}
      </Button>
      <Button variant="outline" size="xs" onClick={onToggleCompact}>
        {compact ? (
          <LayoutList className="h-3.5 w-3.5" />
        ) : (
          <Rows3 className="h-3.5 w-3.5" />
        )}
        {compact ? "Lengkap" : "Ringkas"}
      </Button>
    </div>
  );
}
