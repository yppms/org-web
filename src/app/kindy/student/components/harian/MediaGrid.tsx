"use client";

import { useState } from "react";
import Image from "next/image";
import { HarianMedia } from "@/lib/types";
import { mediaKind, mediaLabel } from "@/lib/harian";

interface MediaGridProps {
  items: HarianMedia[];
  /** Opens the fullscreen viewer at this index. */
  onOpen: (index: number) => void;
}

/**
 * Column spans for one row of the mosaic. Every pattern sums to 6 — that is
 * what keeps the gallery flush with the card on both edges no matter how many
 * photos a teacher attached, including a single one.
 */
const FULL = [6];
const HALVES = [3, 3];
const THIRDS = [2, 2, 2];

/**
 * Packs `count` tiles into full-width rows.
 *
 * Teachers attach anywhere from one photo to six, and a fixed 3-across grid
 * left a lone photo stranded in the left third of the card. Rows are chosen so
 * the last one is never short: 4 becomes 2+2 rather than 3+1, and 5 becomes
 * 3+2 rather than 3+1+1.
 */
const rowsFor = (count: number): number[][] => {
  const rows: number[][] = [];
  let left = count;
  while (left > 0) {
    if (left === 1) rows.push(FULL);
    else if (left === 2 || left === 4) rows.push(HALVES);
    else rows.push(THIRDS);
    left -= rows[rows.length - 1].length;
  }
  return rows;
};

/** Taller tiles when there are fewer of them, so a row never looks squashed. */
const ASPECT: Record<number, string> = {
  6: "aspect-[16/10]",
  3: "aspect-[4/3]",
  2: "aspect-square",
};

const SPAN: Record<number, string> = {
  6: "col-span-6",
  3: "col-span-3",
  2: "col-span-2",
};

/** Roughly how wide the tile renders inside the 425px app column. */
const SIZES: Record<number, string> = {
  6: "390px",
  3: "195px",
  2: "130px",
};

/**
 * The photo/video mosaic under an entry. Tiles are buttons opening the
 * fullscreen viewer; video tiles carry a play badge over their poster frame.
 */
export default function MediaGrid({ items, onOpen }: MediaGridProps) {
  if (items.length === 0) return null;

  const rows = rowsFor(items.length);
  let cursor = 0;

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {rows.flatMap((row) =>
        row.map((span) => {
          const index = cursor++;
          const item = items[index];
          return (
            <MediaTile
              key={item.path}
              item={item}
              span={span}
              onClick={() => onOpen(index)}
            />
          );
        }),
      )}
    </div>
  );
}

function MediaTile({
  item,
  span,
  onClick,
}: {
  item: HarianMedia;
  span: number;
  onClick: () => void;
}) {
  const [useFull, setUseFull] = useState(false);
  const [failed, setFailed] = useState(false);
  const isVideo = mediaKind(item.path) === "video";

  // Photos degrade in two steps — thumbnail → full photo → striped placeholder
  // — because a photo whose thumbnail is missing is still a good photo.
  //
  // Video gets no such fallback: its "thumbnail" is a poster frame, and the
  // full URL is the clip itself. Falling back to that would pull tens of
  // megabytes into a small tile, which is exactly what the poster prevents.
  const src = isVideo
    ? item.thumbUrl
    : useFull || !item.thumbUrl
      ? item.url
      : item.thumbUrl;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Lihat media"
      className={`relative ${SPAN[span]} ${ASPECT[span]} overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary`}
    >
      {src && !failed ? (
        // The thumbnail, never the full media — a grid of originals used to
        // pull several megabytes per tile.
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes={SIZES[span]}
          unoptimized
          loading="lazy"
          onError={() =>
            !isVideo && !useFull ? setUseFull(true) : setFailed(true)
          }
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgb(var(--muted)),rgb(var(--muted))_6px,transparent_6px,transparent_13px)]"
        />
      )}

      {/* Both overlays sit on a real photo, so they carry their own contrast
          instead of relying on theme tokens that could land light-on-light. */}
      {isVideo && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xs text-white shadow-sm"
        >
          ▶
        </span>
      )}

      <span className="absolute bottom-1 left-1.5 rounded bg-black/45 px-1 font-mono text-[10px] text-white/90">
        {mediaLabel(item.path)}
      </span>
    </button>
  );
}
