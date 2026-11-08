"use client";

import { useMemo, useState } from "react";
import { kindyAdminApi, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type {
  CalendarCategory,
  CalendarEvent,
  CalendarEventInput,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  SectionHeader,
  Spinner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
import ListControls from "@/components/ListControls";
import { formatMonthYear } from "@/lib/utils";
import { todayYmd } from "@/lib/harian";
import {
  CATEGORIES,
  CATEGORY_META,
  academicYearOf,
  eventDateLabel,
  monthOf,
} from "@/lib/calendar";
import CalendarFormModal from "./CalendarFormModal";

type Filter = "all" | "upcoming" | CalendarCategory;

/**
 * The admin's view of the academic calendar: every event, grouped by month,
 * with the education office's ones marked "Dinas". Add, edit and delete all
 * work on either kind — the official flag is a label, not a lock.
 */
export default function CalendarSection() {
  const { data, isLoading, error, refetch } = useApi<CalendarEvent[]>(
    () => kindyAdminApi.getCalendarEvents(),
    { fallbackMessage: "Gagal memuat kalender" },
  );
  const events = useMemo(() => data ?? [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = useMemo(() => todayYmd(), []);

  const filtered = useMemo(() => {
    let list = events;
    if (filter === "upcoming") list = list.filter((e) => e.endDate >= today);
    else if (filter !== "all") list = list.filter((e) => e.category === filter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, filter, searchQuery, today]);

  // Month headers, in the server's earliest-first order.
  const byMonth = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    for (const event of filtered) {
      const key = monthOf(event.startDate);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return [...groups.entries()];
  }, [filtered]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    try {
      await action();
      await refetch();
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : fallback);
      return false;
    }
  };

  const handleSubmit = async (input: CalendarEventInput) => {
    const ok = await run(
      () =>
        formMode === "edit" && selected
          ? kindyAdminApi.updateCalendarEvent(selected.id, input)
          : kindyAdminApi.addCalendarEvent(input),
      "Gagal menyimpan agenda. Coba lagi.",
    );
    if (ok) {
      setFormMode(null);
      setSelected(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await run(
      () => kindyAdminApi.deleteCalendarEvent(deleting.id),
      "Gagal menghapus agenda. Coba lagi.",
    );
    setDeleting(null);
  };

  if (isLoading) return <Spinner label="Memuat..." />;
  if (error) return <ErrorAlert message={error} />;

  const years = [...new Set(events.map((e) => academicYearOf(e.startDate)))];

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Kalender Akademik"
        subtitle={
          years.length
            ? `Tahun ajaran ${years.join(", ")} · tampil di portal orang tua`
            : "Tampil di portal orang tua"
        }
        actions={
          <Button size="sm" onClick={() => setFormMode("add")}>
            Tambah
          </Button>
        }
      />

      {actionError && <ErrorAlert message={actionError} />}

      <ListControls
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari agenda…",
        }}
        filter={{
          options: [
            { key: "upcoming", label: "Mendatang" },
            { key: "all", label: "Semua" },
            ...CATEGORIES.map((category) => ({
              key: category,
              label: CATEGORY_META[category].label,
            })),
          ],
          value: filter,
          onChange: setFilter,
        }}
      />

      {byMonth.length === 0 ? (
        <EmptyState
          message={
            searchQuery || filter !== "all"
              ? "Tidak ada agenda yang cocok"
              : "Belum ada agenda"
          }
        />
      ) : (
        byMonth.map(([month, rows]) => (
          <div key={month} className="flex flex-col gap-2">
            <p className="px-1 text-[13px] font-semibold text-muted-foreground">
              {formatMonthYear(month)}
            </p>
            <Card className="px-4">
              {rows.map((event) => {
                const meta = CATEGORY_META[event.category];
                const past = event.endDate < today;
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 py-3 border-b border-border last:border-b-0 ${
                      past ? "opacity-60" : ""
                    }`}
                  >
                    <span
                      className={`mt-1 h-10 w-1 shrink-0 rounded-full ${meta.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {eventDateLabel(event)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={meta.badge}>{meta.label}</Badge>
                        {event.official && (
                          <Badge variant="outline">Dinas</Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSelected(event);
                          setFormMode("edit");
                        }}
                      >
                        Ubah
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setDeleting(event)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {events.length} agenda
        </p>
      )}

      <CalendarFormModal
        mode={formMode}
        event={formMode === "edit" ? selected : null}
        onClose={() => {
          setFormMode(null);
          setSelected(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus agenda ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `"${deleting.title}" (${eventDateLabel(deleting)}) akan hilang dari kalender orang tua.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
