"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/ui";
import { HarianDay, HarianMedia } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { relativeDayLabel, weekdayName } from "@/lib/harian";
import ReportEntries from "./ReportEntries";
import MealEntries from "./MealEntries";

interface DayCardProps {
  /** `YYYY-MM-DD`. */
  date: string;
  /** null while the day is still being fetched. */
  day: HarianDay | null;
  loading?: boolean;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}

/**
 * One school day in the feed: the header, then the day's content in up to two
 * titled groups — "Pendidikan" (the teacher's reports) and "Nutrisi" (what the
 * child was served and ate). Each group appears only when it has something;
 * a child off catering never sees a meal block, and a day with meals but no
 * report still gets a card.
 */
export default function DayCard({
  date,
  day,
  loading = false,
  onOpenMedia,
}: DayCardProps) {
  return (
    <Card>
      {/* "Kemarin" leads, because how long ago is what a parent catching up
          actually wants; the weekday and date stay as the reference. */}
      <CardHeader className="flex-row items-baseline justify-between gap-3 border-b border-border px-5 py-4">
        <CardTitle className="text-[15px]">{relativeDayLabel(date)}</CardTitle>
        <span className="shrink-0 text-xs text-muted-foreground">
          {weekdayName(date)}{" "}
          <span className="font-mono">{formatDate(date)}</span>
        </span>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4">
        {loading || !day ? (
          <Spinner />
        ) : (
          <DayGroups day={day} onOpenMedia={onOpenMedia} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The day's content in its titled groups. Exported so the Beranda card shows
 * the latest day exactly as the feed does.
 */
export function DayGroups({
  day,
  onOpenMedia,
}: {
  day: HarianDay;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}) {
  const hasReport = Boolean(day.classReport || day.individualReport);
  const meals = day.meals ?? [];
  return (
    <div className="flex flex-col gap-5">
      {hasReport && (
        <DayGroup title="Pendidikan">
          <ReportEntries day={day} onOpenMedia={onOpenMedia} />
        </DayGroup>
      )}
      {meals.length > 0 && (
        <DayGroup title="Nutrisi">
          <MealEntries meals={meals} onOpenMedia={onOpenMedia} />
        </DayGroup>
      )}
    </div>
  );
}

/** A titled block inside the day card. */
function DayGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * A school day with nothing to show.
 *
 * Two different reasons land here and a parent should be able to tell them
 * apart: the teacher wrote nothing, or their child wasn't in. On an absent or
 * sick day the class report is deliberately withheld — it describes activities
 * the child had no part in — so without saying so this would read as a missing
 * report.
 */
/** Why the child wasn't in: the status and the teacher's note, if any. */
export interface AwayInfo {
  status: "ABSENT" | "SICK";
  note: string | null;
}

export function NoReportRow({
  date,
  away,
  address,
}: {
  date: string;
  /** Why the child wasn't in, when they weren't. */
  away?: AwayInfo;
  /** How to refer to the child, e.g. "Mas Zaki". */
  address?: string;
}) {
  const who = address ?? "Ananda";
  // "Mas Barra sakit: sakit perut" / "Mas Barra tidak masuk: acara keluarga";
  // a blank note still gets a tail so the parent knows none was given.
  const label = away
    ? `${who} ${away.status === "SICK" ? "sakit" : "tidak masuk"}: ${away.note ?? "belum ada info"}`
    : "Belum ada catatan";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-5 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-semibold text-muted-foreground">
          {relativeDayLabel(date)}
        </span>
        <span className="text-xs text-muted-foreground">
          {weekdayName(date)}{" "}
          <span className="font-mono">{formatDate(date)}</span>
        </span>
      </div>
      <span
        className={`shrink-0 text-xs ${away ? "font-medium text-warning" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}
