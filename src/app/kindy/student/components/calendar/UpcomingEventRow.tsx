"use client";

import { ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { Badge } from "@/components/ui";
import { cn, formatMonthShort } from "@/lib/utils";
import { weekdayName } from "@/lib/harian";
import {
  CATEGORY_META,
  countdownLabel,
  eventDateLabel,
  eventLength,
} from "@/lib/calendar";

/** An event already under way or on today: its countdown reads as "now". */
export const isNow = (countdown: string) =>
  countdown === "Hari ini" || countdown === "Sedang berlangsung";

/**
 * One upcoming event told in full: a date leaf in the category's colour, the
 * title and category, how far off it is, when and how long, the whole
 * description, and where it comes from. Shared by the Kalender tab's list,
 * where a tap turns the grid to its month, and the Beranda card, where it is
 * plain reading. The same event reads the same in both.
 */
export default function UpcomingEventRow({
  event,
  today,
  onClick,
  actionLabel,
  className,
}: {
  event: CalendarEvent;
  today: string;
  /** Makes the row a button; left out, it is static text. */
  onClick?: () => void;
  /** What the tap does, for the accessible name: "lihat di kalender". */
  actionLabel?: string;
  className?: string;
}) {
  const meta = CATEGORY_META[event.category];
  const length = eventLength(event);
  const countdown = countdownLabel(event, today);
  const body = (
    <>
      <div
        aria-hidden
        className={cn(
          "flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none",
          meta.soft,
          meta.text,
        )}
      >
        <span className="text-[10px] font-medium">
          {weekdayName(event.startDate)}
        </span>
        <span className="mt-1 text-xl font-bold tabular-nums">
          {Number(event.startDate.slice(8, 10))}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
          {formatMonthShort(event.startDate)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{event.title}</span>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          <span
            className={cn(
              "font-semibold",
              isNow(countdown) ? "text-primary" : "text-foreground",
            )}
          >
            {countdown}
          </span>
          {" · "}
          {weekdayName(event.startDate)}, {eventDateLabel(event)}
          {length > 1 && ` · ${length} hari`}
        </p>
        {event.description && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          {event.official
            ? "Resmi Dinas Pendidikan Sleman"
            : "TK IT Miftahussalam"}
        </p>
      </div>
    </>
  );
  if (!onClick) {
    return (
      <div className={cn("flex items-start gap-3 py-3", className)}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${event.title}, ${eventDateLabel(event)}: ${actionLabel}`}
      className={cn(
        "-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {body}
      <ChevronRight
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </button>
  );
}
