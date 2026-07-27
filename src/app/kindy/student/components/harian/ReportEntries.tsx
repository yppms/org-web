"use client";

import { HarianDay, HarianEntry, HarianMedia } from "@/lib/types";
import ReportEntryBody from "./ReportEntryBody";
import MediaGrid from "./MediaGrid";

interface ReportEntriesProps {
  day: HarianDay;
  onOpenMedia: (items: HarianMedia[], index: number) => void;
}

/**
 * A day's reports as one continuous narrative: the class report's entries
 * first, then the individual one's, separated by hairlines.
 *
 * Deliberately unlabelled. The class report is the spine — an individual
 * report never exists without one — so tagging the two halves "Kelas" and
 * "Ananda" would advertise a split the parent has no use for.
 */
export default function ReportEntries({
  day,
  onOpenMedia,
}: ReportEntriesProps) {
  const entries: HarianEntry[] = [
    ...(day.classReport?.entries ?? []),
    ...(day.individualReport?.entries ?? []),
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col gap-3">
          {index > 0 && <div className="h-px bg-border" />}
          <ReportEntryBody text={entry.noteParent} />
          <MediaGrid
            items={entry.photos}
            onOpen={(mediaIndex) => onOpenMedia(entry.photos, mediaIndex)}
          />
        </div>
      ))}
    </div>
  );
}
