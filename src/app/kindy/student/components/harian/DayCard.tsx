"use client";

import { Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { HarianDay, HarianMedia } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { weekdayName } from "@/lib/harian";
import ReportEntries from "./ReportEntries";

interface DayCardProps {
  /** `YYYY-MM-DD`. */
  date: string;
  /** null while the day is still being fetched. */
  day: HarianDay | null;
  loading?: boolean;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}

/** One school day in the feed: the header, then the day's reports. */
export default function DayCard({
  date,
  day,
  loading = false,
  onOpenMedia,
}: DayCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle className="text-[15px]">{weekdayName(date)}</CardTitle>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {formatDate(date)}
        </span>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4">
        {loading || !day ? (
          <Spinner />
        ) : (
          <ReportEntries day={day} onOpenMedia={onOpenMedia} />
        )}
      </CardContent>
    </Card>
  );
}

/** A school day the teacher wrote nothing for. */
export function NoReportRow({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-5 py-3.5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          {weekdayName(date)}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(date)}
        </span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        Tidak ada laporan
      </span>
    </div>
  );
}
