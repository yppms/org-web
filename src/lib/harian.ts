/**
 * Calendar and media helpers for Laporan Harian.
 *
 * Every date here is a plain `YYYY-MM-DD` string — the backend sends bare
 * calendar dates and the school runs in a single timezone, so all arithmetic
 * goes through `Date.UTC` and UTC getters. Using local getters would shift the
 * day boundary and silently move a report to the wrong date.
 */

/** Indonesian weekday names, indexed by JS day-of-week (0 = Sunday). */
const WEEKDAYS_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const toUtc = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const toYmd = (date: Date): string => date.toISOString().slice(0, 10);

/** Shifts a date by whole days. `addDays("2026-07-24", -4)` → `"2026-07-20"`. */
export const addDays = (ymd: string, days: number): string => {
  const date = toUtc(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return toYmd(date);
};

/** "Senin", "Jumat", … */
export const weekdayName = (ymd: string): string =>
  WEEKDAYS_ID[toUtc(ymd).getUTCDay()];

/** The Monday on or before `ymd` — the anchor a week is identified by. */
export const mondayOf = (ymd: string): string => {
  // getUTCDay is 0=Sun..6=Sat; (day + 6) % 7 gives days elapsed since Monday.
  const offset = (toUtc(ymd).getUTCDay() + 6) % 7;
  return addDays(ymd, -offset);
};

/** Today as `YYYY-MM-DD`, read in the browser's local calendar. */
export const todayYmd = (): string => {
  const now = new Date();
  const local = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  return toYmd(local);
};

/**
 * Monday–Friday of the week anchored at `monday`. School days only — the
 * portal never shows a weekend row, because a weekend with no report reads as
 * a missing report rather than a day off.
 */
export const schoolDaysOf = (monday: string): string[] =>
  Array.from({ length: 5 }, (_, i) => addDays(monday, i));

/** Chronological comparison of two `YYYY-MM-DD` strings. Lexical works here. */
export const isBefore = (a: string, b: string): boolean => a < b;

/** Inclusive range test. */
export const isWithin = (ymd: string, from: string, to: string): boolean =>
  ymd >= from && ymd <= to;

// ── media ────────────────────────────────────────────────────────────────────

export type MediaKind = "image" | "video";

const extensionOf = (path: string): string => {
  const match = /\.([a-z0-9]+)$/i.exec(path);
  return match ? match[1].toLowerCase() : "";
};

/** Uppercase file-type hint shown on a tile, e.g. "JPG". */
export const mediaLabel = (path: string): string =>
  extensionOf(path).toUpperCase() || "FILE";

/**
 * The field is called `photos` but ~13% of it is video (.mp4 / .mov), so the
 * extension is the only thing that tells them apart.
 */
export const mediaKind = (path: string): MediaKind =>
  ["mp4", "mov", "webm", "ogg", "m4v"].includes(extensionOf(path))
    ? "video"
    : "image";

const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogg: "video/ogg",
};

/**
 * Whether this browser can actually play the file. Asked by capability rather
 * than by extension: `.mov` plays in Safari and fails nearly everywhere else,
 * so hardcoding "mov is broken" would show a needless error to Safari users.
 * Returns `true` on the server, where there is nothing to probe — the viewer
 * only renders after mount.
 */
export const canPlayVideo = (path: string): boolean => {
  if (typeof document === "undefined") return true;
  const mime = MIME_BY_EXT[extensionOf(path)];
  if (!mime) return false;
  return document.createElement("video").canPlayType(mime) !== "";
};
