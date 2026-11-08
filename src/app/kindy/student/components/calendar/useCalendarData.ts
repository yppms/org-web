"use client";

import { useMemo } from "react";
import kindyStudentApi from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type { CalendarEvent, StudentAttendance } from "@/lib/types";

/**
 * What the month grid draws: the academic year's events and the child's
 * attendance, keyed by date. Two requests; when attendance fails the grid
 * still shows, only without the ticks and crosses.
 */
export function useCalendarData() {
  const calendar = useApi<CalendarEvent[]>(
    () => kindyStudentApi.getCalendar(),
    { fallbackMessage: "Gagal memuat kalender" },
  );
  const attendanceQuery = useApi<StudentAttendance[]>(
    () => kindyStudentApi.getAttendance(),
    { fallbackMessage: "Gagal memuat absensi" },
  );
  const events = useMemo(() => calendar.data ?? [], [calendar.data]);
  const attendance = useMemo(
    () =>
      new Map((attendanceQuery.data ?? []).map((row) => [row.date, row])),
    [attendanceQuery.data],
  );
  return {
    events,
    attendance,
    isLoading: calendar.isLoading || attendanceQuery.isLoading,
    error: calendar.error,
  };
}
