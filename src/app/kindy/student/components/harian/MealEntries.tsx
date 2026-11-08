"use client";

import { HarianMeal, HarianMedia } from "@/lib/types";
import ReportEntryBody from "./ReportEntryBody";
import MediaGrid from "./MediaGrid";

interface MealEntriesProps {
  meals: HarianMeal[];
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}

/**
 * Colour for how much was eaten: a finished tray is green, an untouched one
 * red, anything in between amber. The teacher records a five-step scale, so
 * these are the only three cases.
 */
const intakeColor = (pct: number) =>
  pct >= 100 ? "bg-primary" : pct <= 0 ? "bg-destructive" : "bg-warning";
const intakeText = (pct: number) =>
  pct >= 100 ? "text-primary" : pct <= 0 ? "text-destructive" : "text-warning";

/**
 * One line: the meal's title (when there are several), "Konsumsi 75%", and a
 * bar filling the rest of the row, so the amount reads at a glance.
 */
function IntakeRow({ title, pct }: { title?: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-3">
      {title && <span className="shrink-0 text-sm font-semibold">{title}</span>}
      <span className={`shrink-0 text-xs font-semibold ${intakeText(clamped)}`}>
        Konsumsi {clamped}%
      </span>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Konsumsi ${clamped}%`}
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${intakeColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The day's meals, one block each: a title-and-intake line, the menu as the
 * teacher wrote it, and the tray photos. Same hairline rhythm as the report
 * entries so the two groups read as one card.
 *
 * The group is already titled "Nutrisi", so a lone meal carries no heading of
 * its own. Two or more are numbered "Nutrisi 1", "Nutrisi 2" in the order
 * served — by position, not by the teacher's meal number, so a child who was
 * only served the day's second meal still reads "Nutrisi", not "Nutrisi 2".
 */
export default function MealEntries({ meals, onOpenMedia }: MealEntriesProps) {
  const numbered = meals.length > 1;
  return (
    <div className="flex flex-col gap-3.5">
      {meals.map((meal, index) => {
        return (
          <div key={meal.number} className="flex flex-col gap-3">
            {index > 0 && <div className="h-px bg-border" />}
            <IntakeRow
              title={numbered ? `Nutrisi ${index + 1}` : undefined}
              pct={meal.pct}
            />
            {meal.description.trim() !== "" && (
              <ReportEntryBody text={meal.description} />
            )}
            {/* Outside vendor's food is checked and tasted by a teacher
                before it is served; say who, so the parent knows it was. */}
            {meal.type === "EXTERNAL" && meal.checkedBy && (
              <p className="text-xs text-muted-foreground">
                Diperiksa dan dicicipi oleh{" "}
                <span className="font-medium text-foreground">
                  {meal.checkedBy}
                </span>
              </p>
            )}
            <MediaGrid
              items={meal.photos}
              onOpen={(mediaIndex) => onOpenMedia(meal.photos, mediaIndex)}
            />
          </div>
        );
      })}
    </div>
  );
}
