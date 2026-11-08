"use client";

import { StepButton } from "@/components/ui";
import { formatMonthYear } from "@/lib/utils";
import { academicYearShort, addMonths } from "@/lib/calendar";

/** The month's name with its academic year, between a previous and a next. */
export default function MonthStepper({
  month,
  onChange,
}: {
  /** `YYYY-MM`. */
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <StepButton
        direction="prev"
        label="Bulan sebelumnya"
        onClick={() => onChange(addMonths(month, -1))}
      />
      <div className="min-w-0 text-center">
        <h2 className="text-sm font-semibold leading-[18px]">
          {formatMonthYear(month)}
        </h2>
        <p className="text-[11px] leading-[14px] text-muted-foreground">
          {academicYearShort(`${month}-01`)}
        </p>
      </div>
      <StepButton
        direction="next"
        label="Bulan berikutnya"
        onClick={() => onChange(addMonths(month, 1))}
      />
    </div>
  );
}
