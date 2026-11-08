"use client";

import { useEffect, useState } from "react";
import { Button, ErrorAlert, Modal, Spinner } from "@/components/ui";
import { formatDayMonthYear } from "@/lib/utils";
import { daysBetween, todayYmd } from "@/lib/harian";
import { eventDateLabel, monthOf } from "@/lib/calendar";
import MonthGrid, { type DateSelection } from "./MonthGrid";
import MonthStepper from "./MonthStepper";
import { useCalendarData } from "./useCalendarData";

interface DateRangeSheetProps {
  /** The span in force when the sheet opens, if any. */
  from: string | null;
  to: string | null;
  /** The latest pickable day; the daily report has nothing after today. */
  lastPickable?: string;
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}

/**
 * Pick a day or a span of days on the school calendar itself, as a sheet
 * from the bottom. The first tap sets the start, the next the end; a tap
 * before the start, or after a finished span, starts over. One tapped day
 * applied on its own is a one-day span. Holidays, events and the child's
 * attendance show on the grid so the parent picks with the month in view.
 */
export default function DateRangeSheet({
  from,
  to,
  lastPickable = todayYmd(),
  onApply,
  onClose,
}: DateRangeSheetProps) {
  const { events, attendance, isLoading, error } = useCalendarData();
  const [draft, setDraft] = useState<DateSelection>({ from, to });
  const [month, setMonth] = useState(() => monthOf(from ?? lastPickable));

  // A fresh opening starts from the span in force.
  useEffect(() => {
    setDraft({ from, to });
    setMonth(monthOf(from ?? lastPickable));
  }, [from, to, lastPickable]);

  const pick = (ymd: string) => {
    setDraft((current) => {
      if (!current.from || current.to || ymd < current.from) {
        return { from: ymd, to: null };
      }
      return { from: current.from, to: ymd };
    });
  };

  const summary = !draft.from
    ? "Ketuk tanggal mulai."
    : !draft.to
      ? `Mulai ${formatDayMonthYear(draft.from)}. Ketuk tanggal akhir, atau terapkan untuk satu hari.`
      : `${eventDateLabel({ startDate: draft.from, endDate: draft.to })} · ${daysBetween(draft.from, draft.to) + 1} hari`;

  return (
    <Modal
      open
      onClose={onClose}
      placement="bottom"
      title="Pilih tanggal"
      className="px-4"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={!draft.from}
            onClick={() =>
              draft.from && onApply(draft.from, draft.to ?? draft.from)
            }
          >
            Terapkan
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Spinner label="Memuat kalender..." />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <div className="flex flex-col gap-3">
          <MonthStepper month={month} onChange={setMonth} />
          <div className="overflow-hidden rounded-xl border border-border">
            <MonthGrid
              month={month}
              events={events}
              attendance={attendance}
              today={todayYmd()}
              selection={draft}
              onPickDay={pick}
              lastPickable={lastPickable}
            />
          </div>
          <p className="text-center text-[13px] text-muted-foreground" aria-live="polite">
            {summary}
          </p>
        </div>
      )}
    </Modal>
  );
}
