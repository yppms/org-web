"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarEvent, HarianMedia } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorAlert,
  Modal,
  Spinner,
} from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { todayYmd } from "@/lib/harian";
import {
  CATEGORIES,
  CATEGORY_META,
  eventDateLabel,
  eventLength,
  eventsInMonth,
  eventsOn,
  monthOf,
  upcoming,
} from "@/lib/calendar";
import MonthGrid, { ATTENDANCE_META, ATTENDANCE_STATUSES } from "./MonthGrid";
import MonthStepper from "./MonthStepper";
import DaySheet from "./DaySheet";
import UpcomingEventRow from "./UpcomingEventRow";
import { useCalendarData } from "./useCalendarData";

interface CalendarSectionProps {
  onOpenMedia: (items: HarianMedia[], index: number) => void;
  /** How to refer to the child, e.g. "Mas Zaki". */
  address: string;
}

/** How many of the next events are listed under the grid. */
const UPCOMING_COUNT = 3;

/**
 * The academic calendar tab: a month of the school calendar as a grid (see
 * `MonthGrid`), paged a month at a time, with a legend and, under it, the
 * next three events in full — dates, countdown, the whole description — so
 * the month ahead reads without a tap. Tapping an event on the grid opens
 * its full description in a sheet from the bottom; tapping a day the child
 * was registered on opens that day's attendance and daily report; tapping
 * an event in the list brings the grid to its month.
 *
 * The whole academic year arrives in one request, so paging months costs
 * nothing once loaded.
 */
export default function CalendarSection({
  onOpenMedia,
  address,
}: CalendarSectionProps) {
  const { events, attendance, isLoading, error } = useCalendarData();

  const today = useMemo(() => todayYmd(), []);
  const [month, setMonth] = useState(() => monthOf(today));
  const [open, setOpen] = useState<CalendarEvent | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const monthEvents = useMemo(
    () => eventsInMonth(events, month),
    [events, month],
  );
  const next = useMemo(
    () => upcoming(events, today).slice(0, UPCOMING_COUNT),
    [events, today],
  );
  const openRecord = openDay ? attendance.get(openDay) : undefined;
  const jumpTo = (event: CalendarEvent) => {
    setMonth(monthOf(event.startDate));
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) return <Spinner label="Memuat kalender..." />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="flex flex-col gap-3">
      <div ref={gridRef} className="scroll-mt-[72px]">
        <MonthStepper month={month} onChange={setMonth} />
      </div>

      {/* Bleeds 8px past the page gutter: seven columns need the width. */}
      <Card className="-mx-2 overflow-hidden">
        <MonthGrid
          month={month}
          events={monthEvents}
          attendance={attendance}
          today={today}
          openId={open?.id ?? null}
          onOpen={setOpen}
          onOpenDay={setOpenDay}
        />
        {monthEvents.length === 0 && (
          <p className="border-t border-border py-3 text-center text-xs text-muted-foreground">
            Belum ada agenda bulan ini.
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
        {CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const holiday = category === "HOLIDAY";
          return (
            <span
              key={category}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  "h-3 w-3 shrink-0",
                  holiday
                    ? cn(meta.soft, "border border-destructive/30")
                    : cn("rounded ring-[1.5px] ring-inset", meta.ring),
                )}
              />
              {holiday ? "Libur" : meta.label}
            </span>
          );
        })}
        {ATTENDANCE_STATUSES.map((status) => {
          const meta = ATTENDANCE_META[status];
          return (
            <span
              key={status}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground"
            >
              <meta.icon
                className={cn("h-3.5 w-3.5 shrink-0", meta.text)}
                strokeWidth={2.5}
                aria-hidden
              />
              {meta.label}
            </span>
          );
        })}
      </div>

      <UpcomingEvents events={next} today={today} onPick={jumpTo} />

      {openDay && openRecord && (
        <DaySheet
          date={openDay}
          attendance={openRecord}
          events={eventsOn(events, openDay)}
          address={address}
          onOpenEvent={(event) => {
            setOpenDay(null);
            setOpen(event);
          }}
          onOpenMedia={onOpenMedia}
          onClose={() => setOpenDay(null)}
        />
      )}

      <EventModal event={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/**
 * The next few events, each told in full (see `UpcomingEventRow`). Tapping
 * a row turns the grid to that month.
 */
function UpcomingEvents({
  events,
  today,
  onPick,
}: {
  events: CalendarEvent[];
  today: string;
  onPick: (event: CalendarEvent) => void;
}) {
  return (
    <Card className="mt-1">
      <CardHeader className="border-b border-border">
        <CardTitle>Agenda Terdekat</CardTitle>
        <CardDescription>
          {events.length > 0
            ? `${events.length} agenda berikutnya di kalender sekolah`
            : "Agenda berikutnya di kalender sekolah"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col pt-1">
        {events.length === 0 && (
          <p className="py-2 text-[13px] text-muted-foreground">
            Belum ada agenda mendatang.
          </p>
        )}
        {events.map((event, index) => (
          <UpcomingEventRow
            key={event.id}
            event={event}
            today={today}
            onClick={() => onPick(event)}
            actionLabel="lihat di kalender"
            className={cn(index > 0 && "border-t border-border")}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * The tapped event as a sheet from the bottom: kind, when, and the note. A
 * centred dialog would sit over the very date just tapped.
 */
function EventModal({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  const meta = CATEGORY_META[event.category];
  const length = eventLength(event);
  return (
    <Modal
      open
      onClose={onClose}
      placement="bottom"
      title={event.title}
      actions={
        <Button variant="outline" size="sm" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <span className="text-[13px] text-muted-foreground">
            {eventDateLabel(event)}
            {length > 1 && ` · ${length} hari`}
          </span>
        </div>
        {event.description && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          {event.official
            ? "Resmi Dinas Pendidikan Sleman"
            : "TK IT Miftahussalam"}
          {" · diperbarui "}
          {formatDate(event.updatedAt)}
        </p>
      </div>
    </Modal>
  );
}
