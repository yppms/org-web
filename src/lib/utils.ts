// Utility functions for formatting

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names (shadcn convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string => {
  // Use Indonesian format with "Rp" prefix
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `Rp${formatted}`;
};

/** Indonesian month abbreviations, indexed 0–11. */
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Unabbreviated month names, indexed 0–11. For dates that read as a record
 * rather than a compact table cell — a birth date is written out in full on
 * the akta, so the profile matches it.
 */
const MONTHS_ID_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits

  const month = MONTHS_ID[date.getMonth()];

  return `${day}-${month}-${year}`;
};

/**
 * Inclusive date range for a week header, e.g. "20–24 Jul 2026". Collapses the
 * repeated month/year: crossing a month gives "29 Jun–3 Jul 2026", crossing a
 * year gives both in full. Takes plain `YYYY-MM-DD` strings and reads them as
 * calendar dates — no timezone conversion.
 */
export const formatDateRange = (fromYmd: string, toYmd: string): string => {
  const [fy, fm, fd] = fromYmd.split('-').map(Number);
  const [ty, tm, td] = toYmd.split('-').map(Number);

  const from = `${fd} ${MONTHS_ID[fm - 1]}`;
  const to = `${td} ${MONTHS_ID[tm - 1]}`;

  if (fy !== ty) return `${from} ${fy}–${to} ${ty}`;
  if (fm !== tm) return `${from}–${to} ${ty}`;
  return `${fd}–${td} ${MONTHS_ID[tm - 1]} ${ty}`;
};

/**
 * A single calendar date for display, e.g. "16 Februari 2020". Takes an ISO
 * timestamp or a plain `YYYY-MM-DD` and reads the date part literally — no
 * timezone conversion, so a UTC-midnight birth date never slips to the day
 * before. Use this, not `formatDate`, for date-only columns (`@db.Date`).
 */
export const formatCalendarDate = (value: string): string => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS_ID_FULL[m - 1]} ${y}`;
};

/**
 * Completed age today, e.g. "6 tahun 5 bulan". Takes an ISO timestamp or a
 * plain `YYYY-MM-DD` and reads the date part literally, then compares against
 * the local calendar day — the same no-timezone-conversion rule as
 * `formatCalendarDate`.
 *
 * Deliberately stops at months. For TK-age children days change the string
 * every day without informing any decision; add them back here if an under-1
 * case ever turns up. Drops a zero component ("6 tahun", "7 bulan") and
 * returns "Baru lahir" on the birthday itself. Future dates give null.
 */
export const formatAge = (value: string, now: Date = new Date()): string | null => {
  const [by, bm, bd] = value.slice(0, 10).split('-').map(Number);
  const [ny, nm, nd] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];

  let years = ny - by;
  let months = nm - bm;
  if (nd < bd) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return null;
  if (years === 0 && months === 0) return 'Baru lahir';
  if (years === 0) return `${months} bulan`;
  if (months === 0) return `${years} tahun`;
  return `${years} tahun ${months} bulan`;
};

/**
 * Digit-grouped amount for a currency text INPUT, e.g. "1000000" → "1.000.000".
 * No "Rp" prefix — the field label carries it. Returns "" for empty input.
 * Use this instead of `formatCurrency(...).replace("Rp", "")`.
 */
export const formatAmountInput = (value: string | number): string => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Formats a raw digit string (from a currency text input) into "Rp1.000".
 * Returns "" for empty/non-numeric input. Strips any non-digits first.
 */
export const formatRupiah = (value: string): string => {
  const formatted = formatAmountInput(value);
  return formatted ? `Rp${formatted}` : '';
};

/**
 * Date + time in the same Indonesian style as `formatDate`, e.g. "26-Jul-26 14:05".
 * Use this for timestamps — never `toLocaleString("en-GB", …)`.
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${formatDate(dateString)} ${hh}:${mm}`;
};

/**
 * How the school addresses a child: "Mas Zaki", "Mba Naura".
 *
 * "Mba" (not "Mbak") is deliberate — it is the school's own usage. The
 * backend's note rewrites say "Mbak"; that is a separate, teacher-facing
 * surface and is left alone.
 *
 * The honorific is dropped when gender is unrecorded, and the full name stands
 * in when there is no nickname — so this always returns something printable.
 */
export const addressOf = (student: {
  name: string;
  nickname?: string | null;
  gender?: 'MALE' | 'FEMALE' | null;
}): string => {
  const honorific =
    student.gender === 'MALE' ? 'Mas' : student.gender === 'FEMALE' ? 'Mba' : '';
  const called = student.nickname?.trim() || student.name;
  return honorific ? `${honorific} ${called}` : called;
};

/**
 * Title-cases each word, e.g. "a al ibda" → "A Al Ibda". Backend group and
 * year names are stored lowercase; this is for display only.
 */
export const capitalizeWords = (value: string): string =>
  value.replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1));
