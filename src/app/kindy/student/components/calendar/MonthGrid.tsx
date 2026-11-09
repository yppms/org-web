"use client";

import { Fragment, useMemo } from "react";
import { Check, Thermometer, X, type LucideIcon } from "lucide-react";
import type {
  AttendanceStatus,
  CalendarEvent,
  StudentAttendance,
} from "@/lib/types";
import type { WeekBlock, WeekLabel } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { isWithin, weekdayName } from "@/lib/harian";
import {
  CATEGORY_META,
  MAX_TITLE_WORDS,
  WEEKDAY_HEADERS,
  eventDateLabel,
  isWeekend,
  monthGrid,
  titleWords,
  weekLayout,
} from "@/lib/calendar";

/**
 * How each attendance status is drawn in its date cell: a tick for a day at
 * school, a cross for a day away, a thermometer for a sick day, with the
 * teacher's note under the icon when there is one.
 */
export const ATTENDANCE_META: Record<
  AttendanceStatus,
  { label: string; icon: LucideIcon; text: string }
> = {
  PRESENT: { label: "Hadir", icon: Check, text: "text-primary-strong" },
  ABSENT: { label: "Tidak masuk", icon: X, text: "text-destructive-strong" },
  SICK: { label: "Sakit", icon: Thermometer, text: "text-warning-strong" },
};
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "SICK",
];

/** A span of days being picked: `to` is null while only the start is set. */
export interface DateSelection {
  from: string | null;
  to: string | null;
}

interface MonthGridProps {
  /** `YYYY-MM`. */
  month: string;
  events: CalendarEvent[];
  attendance: Map<string, StudentAttendance>;
  today: string;
  /** Browsing: the event whose outline is lit, and what a tap on one does. */
  openId?: string | null;
  onOpen?: (event: CalendarEvent) => void;
  /**
   * Browsing: what a tap on a day the register was taken does (open the
   * day's report). That tap covers the whole cell, events included; the day
   * sheet lists them.
   */
  onOpenDay?: (ymd: string) => void;
  /**
   * Picking: the chosen span and what a tap on a day does. Events then show
   * but take no tap, and days after `lastPickable` take none either.
   */
  selection?: DateSelection;
  onPickDay?: (ymd: string) => void;
  lastPickable?: string;
}

/**
 * A month as a wall-calendar grid, Monday first, with the school's events
 * and the child's attendance drawn on the dates themselves.
 *
 * Days off — holidays and every weekend — fill their cells, and a stretch
 * of them (a semester break that crosses a weekend) is one solid block. A
 * weekend is off by itself, so a holiday is only ever drawn, chipped and
 * tappable on its weekdays; one that falls on a Saturday or Sunday alone
 * shows just its name. Academic events, where the child still comes to
 * school, only outline their dates. Each event carries a small category
 * chip and a two-word title under its first date. Today's whole cell is
 * solid green with "Hari ini" under its number. Each day the register was
 * taken carries the child's attendance right under the number: a tick, a
 * cross, or a thermometer with the teacher's note. Days gone by are not
 * dimmed: looking back over them is what a parent opens this for.
 *
 * Every week row is as tall as the tallest one, so the grid stays even
 * however the titles wrap. The small texts are sized from the grid's own
 * width (`.cal-text` / `.cal-chip` in globals.css), so they fit their cell
 * from a 320px phone up.
 *
 * The same grid serves two jobs: browsing (tap an event to open it) and
 * picking dates for the daily report (tap days to choose a span).
 */
export default function MonthGrid({
  month,
  events,
  attendance,
  today,
  openId = null,
  onOpen,
  onOpenDay,
  selection,
  onPickDay,
  lastPickable,
}: MonthGridProps) {
  const weeks = useMemo(() => monthGrid(month), [month]);
  return (
    <div className="cal-grid">
      <div className="grid grid-cols-7" aria-hidden>
        {WEEKDAY_HEADERS.map((name, index) => (
          <div
            key={name}
            className={cn(
              "pb-1.5 pt-[7px] text-center text-[10.5px] font-semibold uppercase leading-3 tracking-wide",
              index >= 5 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {name}
          </div>
        ))}
      </div>

      {/* `auto-rows-fr`: every week row takes the tallest row's height. */}
      <div className="grid auto-rows-fr">
        {weeks.map((days, weekIndex) => (
          <WeekRow
            key={days.find(Boolean) ?? weekIndex}
            days={days}
            events={events}
            attendance={attendance}
            today={today}
            openId={openId}
            onOpen={onOpen}
            onOpenDay={onOpenDay}
            selection={selection}
            onPickDay={onPickDay}
            lastPickable={lastPickable}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One week: a column of grid lines behind everything, then the day-off
 * tints and event outlines spanning every row of the week, today's solid
 * green column over those, the picked days' tint over that, the day numbers
 * on top, and the texts in their lanes under the numbers — the attendance
 * mark first, then the event texts, then "Hari ini" in today's column.
 * When picking, a transparent button per day lies over it all; when
 * browsing, one lies over each day that has an attendance mark. A final
 * `1fr` row soaks up the height the tallest week forces on this one, so the
 * blocks still fill the row while the texts stay pinned under the numbers.
 */
function WeekRow({
  days,
  events,
  attendance,
  today,
  openId,
  onOpen,
  onOpenDay,
  selection,
  onPickDay,
  lastPickable,
}: {
  days: (string | null)[];
  events: CalendarEvent[];
  attendance: Map<string, StudentAttendance>;
  today: string;
  openId: string | null;
  onOpen?: (event: CalendarEvent) => void;
  onOpenDay?: (ymd: string) => void;
  selection?: DateSelection;
  onPickDay?: (ymd: string) => void;
  lastPickable?: string;
}) {
  // The attendance mark always sits right under the number, so its columns
  // are reserved before the event texts are laid out.
  const marks = useMemo(
    () =>
      days.flatMap((ymd, col) => {
        const record = ymd ? attendance.get(ymd) : undefined;
        return record ? [{ record, col }] : [];
      }),
    [days, attendance],
  );
  const { blocks, labels, lanes } = useMemo(
    () =>
      weekLayout(
        days,
        events,
        marks.map((mark) => mark.col),
      ),
    [days, events, marks],
  );
  // "Hari ini" takes the first lane free in today's column, below the
  // attendance mark and the event texts there. It may add a lane to the row.
  const todayCol = days.indexOf(today);
  const todayLane =
    todayCol < 0
      ? 0
      : firstFreeLane([
          ...(marks.some((mark) => mark.col === todayCol) ? [1] : []),
          ...labels
            .filter(
              (label) =>
                label.startCol <= todayCol && label.endCol >= todayCol,
            )
            .map((label) => label.lane),
        ]);
  const rows = Math.max(lanes, todayLane);
  const offCols = new Set(
    blocks
      .filter((block) => block.kind === "holiday")
      .flatMap((block) =>
        Array.from(
          { length: block.endCol - block.startCol + 1 },
          (_, i) => block.startCol + i,
        ),
      ),
  );

  const picking = !!onPickDay;
  const pickable = (ymd: string) => !lastPickable || ymd <= lastPickable;
  const from = selection?.from ?? null;
  const to = selection?.to ?? from;
  const selected = (ymd: string) => !!from && !!to && isWithin(ymd, from, to);

  return (
    <div
      className="grid min-h-[68px] grid-cols-7 border-t border-border"
      style={{
        gridTemplateRows: `26px repeat(${rows}, auto) minmax(0, 1fr)`,
      }}
    >
      {days.map((_, col) => (
        <div
          key={`line-${col}`}
          aria-hidden
          className={cn(col < 6 && "border-r border-border")}
          style={{ gridColumn: col + 1, gridRow: "1 / -1" }}
        />
      ))}

      {blocks.map((block) => (
        <Block
          key={block.key}
          block={block}
          active={!!block.event && block.event.id === openId}
          onToday={
            block.startCol === todayCol && block.endCol === todayCol
          }
          onOpen={picking ? undefined : onOpen}
        />
      ))}

      {todayCol >= 0 && (
        <>
          <div
            aria-hidden
            className="pointer-events-none bg-primary"
            style={{ gridColumn: todayCol + 1, gridRow: "1 / -1" }}
          />
          <span
            className="cal-text pointer-events-none self-start px-0.5 pb-[5px] pt-[3px] text-center font-semibold text-primary-foreground"
            style={{ gridColumn: todayCol + 1, gridRow: todayLane + 1 }}
          >
            Hari ini
          </span>
        </>
      )}

      {/* The picked span: a tint over its days, a rounded outline on its
          ends (one outline when start and end are the same day). */}
      {days.map(
        (ymd, col) =>
          ymd &&
          selected(ymd) && (
            <div
              key={`pick-${ymd}`}
              aria-hidden
              className="pointer-events-none relative bg-primary/15"
              style={{ gridColumn: col + 1, gridRow: "1 / -1" }}
            >
              {(ymd === from || ymd === to) && (
                <span
                  className={cn(
                    "absolute inset-0.5 rounded-lg ring-2 ring-inset",
                    col === todayCol ? "ring-primary-foreground" : "ring-primary",
                  )}
                />
              )}
            </div>
          ),
      )}

      {days.map((ymd, col) => (
        <DayNumber
          key={ymd ?? `blank-${col}`}
          ymd={ymd}
          col={col}
          isToday={ymd === today}
          off={offCols.has(col)}
          muted={picking && !!ymd && !pickable(ymd)}
        />
      ))}

      {labels.map((label) => (
        <EventLabel
          key={label.event.id}
          label={label}
          onToday={label.startCol === todayCol && label.endCol === todayCol}
        />
      ))}

      {marks.map(({ record, col }) => (
        <AttendanceMark
          key={record.date}
          record={record}
          col={col}
          onToday={col === todayCol}
        />
      ))}

      {!picking &&
        onOpenDay &&
        marks.map(({ record, col }) => (
          <button
            key={`day-${record.date}`}
            type="button"
            onClick={() => onOpenDay(record.date)}
            aria-haspopup="dialog"
            aria-label={`Catatan ${weekdayName(record.date)} ${Number(record.date.slice(8, 10))}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            style={{ gridColumn: col + 1, gridRow: "1 / -1" }}
          />
        ))}

      {picking &&
        days.map(
          (ymd, col) =>
            ymd && (
              <button
                key={`tap-${ymd}`}
                type="button"
                onClick={() => onPickDay?.(ymd)}
                disabled={!pickable(ymd)}
                aria-pressed={selected(ymd)}
                aria-label={`${weekdayName(ymd)} ${Number(ymd.slice(8, 10))}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default"
                style={{ gridColumn: col + 1, gridRow: "1 / -1" }}
              />
            ),
        )}
    </div>
  );
}

/**
 * The child's attendance in a date cell, always in the first lane right
 * under the number: the status icon, and under it the teacher's note on an
 * away day, wrapping as it must. On today's green the mark is drawn in the
 * green's foreground.
 */
function AttendanceMark({
  record,
  col,
  onToday,
}: {
  record: StudentAttendance;
  col: number;
  onToday: boolean;
}) {
  const meta = ATTENDANCE_META[record.status];
  return (
    <span
      role="img"
      aria-label={record.note ? `${meta.label}: ${record.note}` : meta.label}
      className={cn(
        "cal-text pointer-events-none flex flex-col items-center self-start break-words px-0.5 pb-[5px] pt-[3px] text-center font-medium",
        onToday ? "text-primary-foreground" : meta.text,
      )}
      style={{ gridColumn: col + 1, gridRow: 2 }}
    >
      <meta.icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      {record.note && <span className="mt-0.5">{record.note}</span>}
    </span>
  );
}

/** The smallest lane number (from 1) not in `used`. */
const firstFreeLane = (used: number[]): number => {
  let lane = 1;
  while (used.includes(lane)) lane += 1;
  return lane;
};

/**
 * A holiday is a flat tint edge to edge over its weekdays, square so it
 * runs into the weekend's tint as one piece, and the tap opens it (a
 * weekend tint has nothing to open). Tapped, it shows a rounded outline
 * 2px inside the tint — the same shape as an event outline, which sits 2px
 * inside its cells with rounded corners and continues flat into the next
 * or previous week. One that is only today's cell lies under the solid
 * green column, so an outline there is drawn in the green's foreground.
 * Without `onOpen` (while picking dates) it is just the drawing.
 */
function Block({
  block,
  active,
  onToday,
  onOpen,
}: {
  block: WeekBlock;
  active: boolean;
  onToday: boolean;
  onOpen?: (event: CalendarEvent) => void;
}) {
  const { event, kind, startCol, endCol, startsHere, endsHere } = block;
  const style = {
    gridColumn: `${startCol + 1} / ${endCol + 2}`,
    gridRow: "1 / -1",
  };
  if (!event) {
    return (
      <div aria-hidden className={CATEGORY_META.HOLIDAY.soft} style={style} />
    );
  }
  const meta = CATEGORY_META[event.category];
  const className = cn(
    "transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    kind === "holiday"
      ? cn("relative", meta.soft)
      : cn(
          "m-0.5 rounded-lg ring-inset",
          onToday ? "ring-primary-foreground/70" : meta.ring,
          active ? cn("ring-2", meta.soft) : "ring-[1.5px]",
          !startsHere && "ml-0 rounded-l-none",
          !endsHere && "mr-0 rounded-r-none",
        ),
  );
  const outline = kind === "holiday" && active && (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0.5 rounded-lg ring-2 ring-inset",
        meta.ring,
      )}
    />
  );
  if (!onOpen) {
    return (
      <div aria-hidden className={className} style={style}>
        {outline}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      aria-expanded={active}
      aria-label={`${meta.label}: ${event.title}, ${eventDateLabel(event)}`}
      className={className}
      style={style}
    >
      {outline}
    </button>
  );
}

function DayNumber({
  ymd,
  col,
  isToday,
  off,
  muted,
}: {
  ymd: string | null;
  col: number;
  isToday: boolean;
  off: boolean;
  /** Greyed: a day that cannot be picked. */
  muted: boolean;
}) {
  const style = { gridColumn: col + 1, gridRow: 1 };
  if (!ymd) return <div aria-hidden style={style} />;
  const day = Number(ymd.slice(8, 10));
  return (
    <div
      className="pointer-events-none h-[26px] pt-1.5 text-center text-xs font-medium leading-4 tabular-nums"
      style={style}
    >
      <span
        className={cn(
          isToday
            ? "font-bold text-primary-foreground"
            : muted
              ? "text-muted-foreground/60"
              : off || isWeekend(ymd)
                ? "text-destructive-strong"
                : "text-foreground",
        )}
        aria-label={`${weekdayName(ymd)} ${day}`}
        aria-current={isToday ? "date" : undefined}
      >
        {day}
      </span>
    </div>
  );
}

/**
 * The event's text, right under its first date and centred across its
 * days: the category as a small square-cornered solid chip, then the title.
 * In one column a title within the limit stacks a word per line; across a
 * span it runs on one line. A title over the limit wraps word by word, and
 * a word is only ever split when it is wider than the cell on its own.
 */
function EventLabel({
  label,
  onToday,
}: {
  label: WeekLabel;
  /** The text sits only in today's cell, on the solid green. */
  onToday: boolean;
}) {
  const { event, lane, startCol, endCol, withCategory } = label;
  const meta = CATEGORY_META[event.category];
  const words = titleWords(event.title);
  const single = startCol === endCol && words.length <= MAX_TITLE_WORDS;
  return (
    <span
      className={cn(
        "cal-text pointer-events-none self-start break-words px-0.5 pb-[5px] pt-[3px] text-center font-semibold",
        onToday ? "text-primary-foreground" : meta.text,
        !withCategory && "font-medium",
      )}
      style={{
        gridColumn: `${startCol + 1} / ${endCol + 2}`,
        gridRow: lane + 1,
      }}
    >
      {withCategory && (
        <span
          className={cn(
            "cal-chip mx-auto mb-[3px] block w-fit max-w-full font-semibold",
            onToday
              ? "bg-primary-foreground/25 text-primary-foreground"
              : cn("text-strong-foreground", meta.chip),
            startCol !== endCol && "cal-chip-wide",
          )}
        >
          {meta.label}
        </span>
      )}
      {single
        ? words.map((word, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {word}
            </Fragment>
          ))
        : event.title}
    </span>
  );
}
