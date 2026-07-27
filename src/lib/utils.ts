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
 * Title-cases each word, e.g. "a al ibda" → "A Al Ibda". Backend group and
 * year names are stored lowercase; this is for display only.
 */
export const capitalizeWords = (value: string): string =>
  value.replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1));
