import type { CalendarCategory, CalendarEvent } from "./types";
import { formatDateRange, formatDayMonthYear } from "./utils";
import { addDays, daysBetween, isWithin, mondayOf, todayYmd } from "./harian";

// Helpers for the academic calendar, shared by the parent tab and the admin
// section. Dates are `YYYY-MM-DD` strings throughout, compared as strings.

/**
 * Label and colour tokens per category — the same two everywhere.
 *
 * On the parent's month grid a holiday fills its dates (`soft`), while an
 * academic event only outlines its own (`ring`): the child still comes to
 * school.
 * The small text on the grid uses the `-strong` shade (`text`, `chip`)
 * because the base shade is too light to read at 10px.
 */
export const CATEGORY_META: Record<
  CalendarCategory,
  {
    label: string;
    /** Badge variant. */
    badge: "destructive" | "default";
    /** Solid dot in legends and the admin list. */
    dot: string;
    /** Tinted fill (the holiday block, the active outline). */
    soft: string;
    /** Small text on the grid. */
    text: string;
    /** Solid fill of the category chip on the grid. */
    chip: string;
    /** Outline colour on the grid (`ring-*`). */
    ring: string;
  }
> = {
  HOLIDAY: {
    label: "Libur",
    badge: "destructive",
    dot: "bg-destructive",
    soft: "bg-destructive-soft",
    text: "text-destructive-strong",
    chip: "bg-destructive-strong",
    ring: "ring-destructive",
  },
  ACADEMIC: {
    label: "Akademik",
    badge: "default",
    dot: "bg-primary",
    soft: "bg-primary-soft",
    text: "text-primary-strong",
    chip: "bg-primary-strong",
    ring: "ring-primary",
  },
};

// HOLIDAY is every day off, national or the school's own; ACADEMIC is
// everything else on the school calendar (first day, report cards, outings).
export const CATEGORIES: CalendarCategory[] = ["HOLIDAY", "ACADEMIC"];

export const WEEKDAY_HEADERS = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
];

/**
 * A title fits its date cell on a phone only when it is short: at most two
 * words, each at most nine letters ("Pancasila", "Ramadhan"), so a one-day
 * event stacks one word per line and a span fits both on one. The admin
 * form enforces this; the full name and the story go in the description.
 */
export const MAX_TITLE_WORDS = 2;
export const MAX_TITLE_WORD_LENGTH = 9;

/** The title's words, for stacking one per line in a one-day cell. */
export const titleWords = (title: string): string[] =>
  title.trim().split(/\s+/).filter(Boolean);

/** Why a title would not fit the grid, or `null` when it fits. */
export const titleProblem = (title: string): string | null => {
  const words = titleWords(title);
  if (words.length === 0) return null;
  if (words.length > MAX_TITLE_WORDS) {
    return `Maksimal ${MAX_TITLE_WORDS} kata (sekarang ${words.length}).`;
  }
  const long = words.find((word) => word.length > MAX_TITLE_WORD_LENGTH);
  if (long) {
    return `"${long}" lebih dari ${MAX_TITLE_WORD_LENGTH} huruf; singkat agar muat di kotak tanggal.`;
  }
  return null;
};

/** `YYYY-MM` of a `YYYY-MM-DD`. */
export const monthOf = (ymd: string): string => ymd.slice(0, 7);

/** The month `delta` months away from `ym`. */
export const addMonths = (ym: string, delta: number): string => {
  const [y, m] = ym.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
};

/** Last day of the month, as `YYYY-MM-DD`. */
export const endOfMonth = (ym: string): string =>
  addDays(`${addMonths(ym, 1)}-01`, -1);

/**
 * The month as rows of seven, Monday first, with `null` for the cells before
 * the 1st and after the last day — the shape a calendar grid renders.
 */
export const monthGrid = (ym: string): (string | null)[][] => {
  const first = `${ym}-01`;
  const last = endOfMonth(ym);
  const rows: (string | null)[][] = [];
  let cursor = mondayOf(first);
  while (cursor <= last) {
    const row: (string | null)[] = [];
    for (let i = 0; i < 7; i += 1) {
      row.push(monthOf(cursor) === ym ? cursor : null);
      cursor = addDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
};

/** Saturday or Sunday. */
export const isWeekend = (ymd: string): boolean => {
  const day = new Date(`${ymd}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

/** Events that cover `ymd`. */
export const eventsOn = (events: CalendarEvent[], ymd: string) =>
  events.filter((event) => isWithin(ymd, event.startDate, event.endDate));

/** Events touching the month, earliest first (the server's order). */
export const eventsInMonth = (events: CalendarEvent[], ym: string) => {
  const from = `${ym}-01`;
  const to = endOfMonth(ym);
  return events.filter(
    (event) => event.startDate <= to && event.endDate >= from,
  );
};

/** "18 Des 2026", or "21–31 Des 2026" for a span. */
export const eventDateLabel = (
  event: Pick<CalendarEvent, "startDate" | "endDate">,
) =>
  event.startDate === event.endDate
    ? formatDayMonthYear(event.startDate)
    : formatDateRange(event.startDate, event.endDate);

/** Days the span covers, inclusive. */
export const eventLength = (
  event: Pick<CalendarEvent, "startDate" | "endDate">,
) => {
  const a = new Date(`${event.startDate}T00:00:00Z`).getTime();
  const b = new Date(`${event.endDate}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
};

/**
 * "2026/2027" for the academic year a date falls in. Years run mid-July to
 * early July, so July onwards belongs to the year starting that July.
 */
export const academicYearOf = (ymd: string): string => {
  const [y, m] = ymd.split("-").map(Number);
  const start = m >= 7 ? y : y - 1;
  return `${start}/${start + 1}`;
};

/** "TA 2627": the school's shorthand for the academic year 2026/2027. */
export const academicYearShort = (ymd: string): string => {
  const [start, end] = academicYearOf(ymd).split("/");
  return `TA ${start.slice(2)}${end.slice(2)}`;
};

/** The next events on or after today, earliest first. */
export const upcoming = (events: CalendarEvent[], today = todayYmd()) =>
  events.filter((event) => event.endDate >= today);

/**
 * How far off an event is, the way a parent would say it: "Hari ini",
 * "Besok", "Lusa", then "5 hari lagi"; an event already under way is
 * "Sedang berlangsung", and one that is over "Selesai".
 */
export const countdownLabel = (
  event: Pick<CalendarEvent, "startDate" | "endDate">,
  today = todayYmd(),
): string => {
  if (event.endDate < today) return "Selesai";
  if (event.startDate <= today) {
    return event.startDate === event.endDate ? "Hari ini" : "Sedang berlangsung";
  }
  const days = daysBetween(today, event.startDate);
  if (days === 1) return "Besok";
  if (days === 2) return "Lusa";
  return `${days} hari lagi`;
};

/**
 * One shape drawn on a week row of the month grid, over the columns it
 * covers (0 = Monday). A `holiday` block is a solid tint over a holiday's
 * weekdays, or over a weekend (`event` null) — both the same flat red, so
 * a holiday running through a weekend simply reads as more red. Saturday
 * and Sunday are off anyway, so they are never part of a holiday's block:
 * a holiday only on them (Easter Sunday) has no block and nothing to tap,
 * just its name, and one that runs Thursday to Monday is tinted, outlined
 * when tapped, and labelled on its weekdays only. An `event` block is the
 * outline of one academic event, on whichever days it has, Saturday
 * included.
 */
export interface WeekBlock {
  key: string;
  kind: "holiday" | "event";
  event: CalendarEvent | null;
  startCol: number;
  endCol: number;
  /** False when the event began in an earlier week (flat left edge). */
  startsHere: boolean;
  /** False when the event goes on into the next week (flat right edge). */
  endsHere: boolean;
}

/**
 * One event's text on a week row: in `lane` (1 = right under the day
 * numbers), across the event's columns. `withCategory` is false for a
 * holiday whose dates all lie inside a longer one (Christmas inside the
 * semester break), whose category the enclosing label already says, and
 * for one that falls on the weekend alone (Easter Sunday), which is off
 * regardless. Two holidays merely bridged by a weekend (Nyepi, then Idul
 * Fitri) each keep their own.
 */
export interface WeekLabel {
  event: CalendarEvent;
  lane: number;
  startCol: number;
  endCol: number;
  withCategory: boolean;
}

export interface WeekLayout {
  blocks: WeekBlock[];
  labels: WeekLabel[];
  /** Label lanes the row needs (at least 1, so every row keeps its shape). */
  lanes: number;
}

/**
 * Lays one week of the month grid out. `days` is one row of `monthGrid`.
 *
 * Every holiday tints its own weekdays, longest first so a holiday inside
 * a longer one (Christmas in the semester break) is drawn on top and takes
 * the tap. Every weekend day gets the same tint, with nothing to tap: it
 * is off whether or not a holiday falls on it, so a holiday with no
 * weekday in the week keeps only its name. Every other event is outlined
 * over its own days. Labels take the first lane with room, longest event
 * first, so spans sit on top and one-day events fill in under them —
 * except in `reservedCols`, where the first lane is already spoken for
 * (the child's attendance mark sits right under the number) and labels
 * start below.
 */
export const weekLayout = (
  days: (string | null)[],
  events: CalendarEvent[],
  reservedCols: number[] = [],
): WeekLayout => {
  const colsOf = (event: CalendarEvent) =>
    days
      .map((day, col) =>
        day && isWithin(day, event.startDate, event.endDate) ? col : -1,
      )
      .filter((col) => col >= 0);

  // A holiday is drawn on its weekdays; one with none this week (Easter
  // Sunday) is `weekendOnly`: named over the weekend, never a block.
  const inWeek = events
    .map((event) => {
      const all = colsOf(event);
      const weekdays =
        event.category === "HOLIDAY"
          ? all.filter((col) => !isWeekend(days[col] as string))
          : all;
      const weekendOnly = all.length > 0 && weekdays.length === 0;
      return { event, cols: weekendOnly ? all : weekdays, weekendOnly };
    })
    .filter(({ cols }) => cols.length > 0)
    .sort(
      (a, b) =>
        eventLength(b.event) - eventLength(a.event) ||
        a.cols[0] - b.cols[0] ||
        a.event.title.localeCompare(b.event.title),
    );
  const holidays = inWeek.filter(({ event }) => event.category === "HOLIDAY");

  // A holiday whose whole range lies inside a longer holiday's.
  const nested = (event: CalendarEvent) =>
    holidays.some(
      ({ event: other }) =>
        other !== event &&
        other.startDate <= event.startDate &&
        other.endDate >= event.endDate &&
        eventLength(other) > eventLength(event),
    );

  const blocks: WeekBlock[] = [];

  // The weekend, Saturday and Sunday joined when the month has both.
  for (let col = 0; col < 7; col += 1) {
    const day = days[col];
    if (!day || !isWeekend(day)) continue;
    const last = blocks[blocks.length - 1];
    if (last && last.event === null && last.endCol === col - 1) {
      last.endCol = col;
    } else {
      blocks.push({
        key: `w-${day}`,
        kind: "holiday",
        event: null,
        startCol: col,
        endCol: col,
        startsHere: true,
        endsHere: true,
      });
    }
  }

  for (const { event, cols, weekendOnly } of inWeek) {
    if (weekendOnly) continue;
    const startCol = cols[0];
    const endCol = cols[cols.length - 1];
    blocks.push({
      key: `e-${event.id}`,
      kind: event.category === "HOLIDAY" ? "holiday" : "event",
      event,
      startCol,
      endCol,
      startsHere: days[startCol] === event.startDate,
      endsHere: days[endCol] === event.endDate,
    });
  }

  // Labels: longest first, each into the first lane whose columns are free.
  const lanes: boolean[][] = [];
  if (reservedCols.length > 0) {
    lanes.push(days.map((_, col) => reservedCols.includes(col)));
  }
  const labels: WeekLabel[] = [];
  for (const { event, cols, weekendOnly } of inWeek) {
    const startCol = cols[0];
    const endCol = cols[cols.length - 1];
    let lane = lanes.findIndex((used) => cols.every((c) => !used[c]));
    if (lane < 0) {
      lane = lanes.length;
      lanes.push(Array(7).fill(false));
    }
    for (const c of cols) lanes[lane][c] = true;
    labels.push({
      event,
      lane: lane + 1,
      startCol,
      endCol,
      withCategory: !(
        event.category === "HOLIDAY" &&
        (weekendOnly || nested(event))
      ),
    });
  }

  return { blocks, labels, lanes: Math.max(1, lanes.length) };
};
