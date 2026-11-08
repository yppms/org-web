"use client";

import { ChevronRight } from "lucide-react";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type {
  CalendarEvent,
  HarianDay,
  HarianMedia,
  StudentAttendance,
} from "@/lib/types";
import {
  Badge,
  Button,
  ErrorAlert,
  Modal,
  Spinner,
} from "@/components/ui";
import { cn, formatDayMonthYear } from "@/lib/utils";
import { relativeDayLabel, weekdayName } from "@/lib/harian";
import { CATEGORY_META, eventDateLabel } from "@/lib/calendar";
import { DayGroups } from "../harian/DayCard";
import { ATTENDANCE_META } from "./MonthGrid";

interface DaySheetProps {
  /** `YYYY-MM-DD`. */
  date: string;
  attendance: StudentAttendance;
  /** The calendar's events on that day. */
  events: CalendarEvent[];
  /** How to refer to the child, e.g. "Mas Zaki". */
  address: string;
  onOpenEvent: (event: CalendarEvent) => void;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
  onClose: () => void;
}

/**
 * A school day tapped on the calendar, as a sheet from the bottom: how the
 * child's attendance was marked, the calendar's events that day (tap one
 * for its own sheet), and the day's daily report exactly as the Harian feed
 * shows it. The report is fetched when the sheet opens.
 */
export default function DaySheet({
  date,
  attendance,
  events,
  address,
  onOpenEvent,
  onOpenMedia,
  onClose,
}: DaySheetProps) {
  const { data: day, isLoading, error } = useApi<HarianDay>(
    () => kindyStudentApi.getHarianDay(date),
    { deps: [date], fallbackMessage: "Gagal memuat catatan harian" },
  );
  const meta = ATTENDANCE_META[attendance.status];
  const away = attendance.status !== "PRESENT";
  const hasContent =
    !!day &&
    (!!day.classReport || !!day.individualReport || (day.meals ?? []).length > 0);

  return (
    <Modal
      open
      onClose={onClose}
      placement="bottom"
      title={`${weekdayName(date)}, ${formatDayMonthYear(date)}`}
      actions={
        <Button variant="outline" size="sm" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">
            {relativeDayLabel(date)}
          </p>
          {/* "Mas Barra sakit: demam" — the status with the teacher's note,
              in the status's colour. */}
          <p
            className={cn(
              "flex items-start gap-1.5 text-sm font-medium",
              meta.text,
            )}
          >
            <meta.icon
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>
              {address} {meta.label.toLowerCase()}
              {away && `: ${attendance.note ?? "belum ada info"}`}
            </span>
          </p>
        </div>

        {events.length > 0 && (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {events.map((event) => {
              const category = CATEGORY_META[event.category];
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onOpenEvent(event)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Badge variant={category.badge}>{category.label}</Badge>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {event.title}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {eventDateLabel(event)}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <Spinner label="Memuat catatan..." />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : hasContent && day ? (
          <DayGroups day={day} onOpenMedia={onOpenMedia} />
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
            {away
              ? `Laporan kelas tidak ditampilkan karena ${address} tidak masuk hari itu.`
              : "Belum ada catatan harian pada hari ini."}
          </p>
        )}
      </div>
    </Modal>
  );
}
