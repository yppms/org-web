"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import kindyStudentApi, { ApiError } from "@/lib/api";
import { HarianDay, HarianIndexEntry, HarianMedia } from "@/lib/types";
import { ErrorAlert, Input, Spinner } from "@/components/ui";
import { Info } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import {
  addDays,
  isWithin,
  mondayOf,
  schoolDaysOf,
  todayYmd,
} from "@/lib/harian";
import DayCard, { NoReportRow } from "./DayCard";

interface HarianSectionProps {
  onOpenMedia: (items: HarianMedia[], index: number) => void;
  /** How to refer to the child, e.g. "Mas Zaki". */
  address: string;
}

/**
 * The daily-report feed, browsed a school week at a time with an optional
 * date-range mode.
 *
 * The index (which days have a report) is fetched once; each day's content is
 * fetched on demand and cached, so stepping back through weeks costs one
 * request per new day and revisiting a week costs none.
 */
export default function HarianSection({
  onOpenMedia,
  address,
}: HarianSectionProps) {
  const [index, setIndex] = useState<HarianIndexEntry[] | null>(null);
  const [days, setDays] = useState<Record<string, HarianDay>>({});
  const [error, setError] = useState<string | null>(null);

  const [monday, setMonday] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const today = useMemo(() => todayYmd(), []);
  const currentMonday = useMemo(() => mondayOf(today), [today]);

  useEffect(() => {
    let cancelled = false;
    kindyStudentApi
      .getHarianIndex()
      .then((response) => {
        if (cancelled) return;
        const rows = response.data ?? [];
        setIndex(rows);
        // Land on the most recent week that actually has a report — an empty
        // current week as the opening screen reads as a broken feature.
        const newest = rows[0]?.date;
        setMonday(newest ? mondayOf(newest) : mondayOf(todayYmd()));
        if (rows.length > 0) {
          setRangeFrom(rows[rows.length - 1].date);
          setRangeTo(rows[0].date);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat laporan harian",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Days that actually have something to read. The index also lists days the
   * child was absent — those carry no report by design, so they must not be
   * mistaken for one.
   */
  const reportDates = useMemo(
    () =>
      new Set(
        (index ?? [])
          .filter((entry) => entry.hasClassReport || entry.hasIndividual)
          .map((entry) => entry.date),
      ),
    [index],
  );

  const absentDates = useMemo(
    () =>
      new Set(
        (index ?? [])
          .filter((entry) => entry.attendance === "ABSENT")
          .map((entry) => entry.date),
      ),
    [index],
  );

  /** The dates on screen right now, newest first. */
  const visibleDates = useMemo(() => {
    if (!index) return [];
    if (rangeMode) {
      if (!rangeFrom || !rangeTo || rangeFrom > rangeTo) return [];
      return index
        .filter((entry) => isWithin(entry.date, rangeFrom, rangeTo))
        .map((entry) => entry.date);
    }
    if (!monday) return [];
    return schoolDaysOf(monday)
      .filter((date) => date <= today)
      .reverse();
  }, [index, rangeMode, rangeFrom, rangeTo, monday, today]);

  // Pull the content for any visible day that has a report and isn't cached.
  useEffect(() => {
    const missing = visibleDates.filter(
      (date) => reportDates.has(date) && !days[date],
    );
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map((date) =>
        kindyStudentApi
          .getHarianDay(date)
          .then((response) => response.data ?? null)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const fetched: Record<string, HarianDay> = {};
      results.forEach((day, i) => {
        if (day) fetched[missing[i]] = day;
      });
      if (Object.keys(fetched).length > 0) {
        setDays((previous) => ({ ...previous, ...fetched }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visibleDates, reportDates, days]);

  const openRange = useCallback(() => setRangeMode(true), []);
  const closeRange = useCallback(() => setRangeMode(false), []);

  if (error) return <ErrorAlert message={error} />;
  if (!index || !monday) return <Spinner label="Memuat laporan..." />;

  const earliestMonday = index.length
    ? mondayOf(index[index.length - 1].date)
    : currentMonday;
  const canGoOlder = monday > earliestMonday;
  const canGoNewer = monday < currentMonday;

  return (
    <div className="flex flex-col gap-3">
      {rangeMode ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={rangeFrom}
            onChange={(event) => setRangeFrom(event.target.value)}
            aria-label="Dari tanggal"
            className="h-9 min-w-0 flex-1 text-[13px]"
          />
          <span className="shrink-0 text-[13px] text-muted-foreground">–</span>
          <Input
            type="date"
            value={rangeTo}
            onChange={(event) => setRangeTo(event.target.value)}
            aria-label="Sampai tanggal"
            className="h-9 min-w-0 flex-1 text-[13px]"
          />
          <button
            type="button"
            onClick={closeRange}
            title="Kembali ke mingguan"
            aria-label="Kembali ke tampilan mingguan"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-[15px] text-muted-foreground transition-colors hover:bg-muted"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <StepButton
              glyph="‹"
              label="Minggu sebelumnya"
              disabled={!canGoOlder}
              onClick={() => setMonday(addDays(monday, -7))}
            />
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm font-semibold">
                {formatDateRange(monday, addDays(monday, 4))}
              </span>
              {monday === currentMonday && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Minggu ini
                </span>
              )}
            </div>
            <StepButton
              glyph="›"
              label="Minggu berikutnya"
              disabled={!canGoNewer}
              onClick={() => setMonday(addDays(monday, 7))}
            />
          </div>
          <button
            type="button"
            onClick={openRange}
            className="-mt-1 self-center px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pilih rentang tanggal
          </button>
        </>
      )}

      {rangeMode && visibleDates.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-8 text-center">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Belum ada catatan pada rentang tanggal ini.
          </p>
        </div>
      )}

      {visibleDates.map((date) =>
        reportDates.has(date) ? (
          <DayCard
            key={date}
            date={date}
            day={days[date] ?? null}
            loading={!days[date]}
            onOpenMedia={onOpenMedia}
          />
        ) : (
          <NoReportRow
            key={date}
            date={date}
            absent={absentDates.has(date)}
            address={address}
          />
        ),
      )}

      <Disclaimer />
    </div>
  );
}

/**
 * Sets expectations about the feed: reports are written up after the school day
 * ends, so slips are possible — and points parents to the teacher to confirm.
 */
function Disclaimer() {
  return (
    <div className="mt-1 flex items-start gap-2.5 rounded-xl bg-muted px-4 py-3.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="prose text-xs leading-relaxed text-muted-foreground">
        Catatan memuat kegiatan Ananda selama di sekolah. Ditulis setelah
        kegiatan hari berakhir. Kesalahan atau hal terlewat masih mungkin
        terjadi. Apabila wali santri menemukan catatan yang dirasa kurang sesuai
        atau ingin ditanyakan, mohon sampaikan kepada guru bersangkutan.
      </p>
    </div>
  );
}

function StepButton({
  glyph,
  label,
  disabled,
  onClick,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-card"
    >
      {glyph}
    </button>
  );
}
