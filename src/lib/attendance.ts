import type { AttendanceStatus } from './types';

/** Every status but PRESENT: the child stayed home. */
export type AwayStatus = Exclude<AttendanceStatus, 'PRESENT'>;

/**
 * What a parent reads for each status — the calendar legend, and lowercased
 * in the "Mas Barra sakit: demam" lines. The teacher picks one of three
 * reasons (sick / excused / didn't want to come); `ABSENT` is an away day
 * with no reason recorded, which is every one from before the reasons
 * existed.
 */
export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Hadir',
  SICK: 'Sakit',
  EXCUSED: 'Izin',
  REFUSED: 'Tidak mau sekolah',
  ABSENT: 'Tidak masuk',
};

export const isAway = (
  status: AttendanceStatus | null | undefined,
): status is AwayStatus => status != null && status !== 'PRESENT';

/**
 * "Mas Barra sakit: demam", "Ananda izin: acara keluarga"; a blank note still
 * gets a tail so the parent knows none was given.
 */
export const awayLine = (
  who: string,
  status: AwayStatus,
  note: string | null | undefined,
): string =>
  `${who} ${ATTENDANCE_LABEL[status].toLowerCase()}: ${note ?? 'belum ada info'}`;
