"use client";

import { useEffect, useState } from "react";
import { HarianMedia } from "@/lib/types";
import { canPlayVideo, mediaKind, mediaLabel } from "@/lib/harian";

interface MediaViewerProps {
  /** The media set being browsed, or null when the viewer is closed. */
  items: HarianMedia[] | null;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Fullscreen photo/video viewer.
 *
 * The media fills the whole viewport and the chrome floats over it on scrims,
 * rather than the media sitting in a boxed-off area with bars above and below
 * — a phone screen is small enough that giving the photo every pixel matters.
 *
 * Sits above the modals (z-[115]) because it can be opened from a card that is
 * itself inside one.
 */
export default function MediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
}: MediaViewerProps) {
  // Escape and arrow keys, and a body scroll lock while open.
  useEffect(() => {
    if (!items) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (event.key === "ArrowRight" && index < items.length - 1)
        onIndexChange(index + 1);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [items, index, onIndexChange, onClose]);

  if (!items || items.length === 0) return null;

  const current = items[index];
  const isVideo = mediaKind(current.path) === "video";
  const counter = `${isVideo ? "Video" : "Foto"} ${index + 1} dari ${items.length}`;

  return (
    <div className="fixed inset-0 z-[115] bg-black">
      {/* The media itself — every pixel of the viewport. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <MediaFrame key={current.path} item={current} />
      </div>

      {/* Chrome floats on scrims so it stays legible over a bright photo
          without stealing space from it. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-5 pb-8 pt-4">
        <span className="text-[13px] text-white/80">{counter}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="pointer-events-auto -mr-2 px-2 py-1 text-2xl leading-none text-white/90"
        >
          ×
        </button>
      </div>

      {items.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent px-5 pb-6 pt-10">
          <StepButton
            label="Sebelumnya"
            glyph="‹"
            disabled={index === 0}
            onClick={() => onIndexChange(index - 1)}
          />
          <StepButton
            label="Berikutnya"
            glyph="›"
            disabled={index === items.length - 1}
            onClick={() => onIndexChange(index + 1)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * The media itself. Video uses native controls — the browser's own play,
 * scrubber and timer — rather than a hand-built transport.
 */
function MediaFrame({ item }: { item: HarianMedia }) {
  const [failed, setFailed] = useState(false);

  if (mediaKind(item.path) === "image") {
    if (failed) {
      // Deliberately not naming a cause: an expired signed URL, a dropped
      // connection and an undecodable file all land here, and guessing wrong
      // sends the parent chasing the wrong fix.
      return (
        <Unavailable
          title="Foto tidak dapat dimuat"
          detail="Muat ulang halaman untuk mencoba lagi."
        />
      );
    }
    return (
      // Signed, expiring, arbitrary-dimension media from the school's blob
      // store — next/image would re-fetch a URL that changes every load.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt=""
        onError={() => setFailed(true)}
        className="max-h-full max-w-full object-contain"
      />
    );
  }

  // .mov plays in Safari and almost nowhere else, so ask the browser rather
  // than assuming from the extension. `failed` covers the case where it said
  // yes and then couldn't — a codec inside the container it can't decode.
  if (failed || !canPlayVideo(item.path)) {
    return (
      <Unavailable
        title={`Video .${mediaLabel(item.path).toLowerCase()} tidak dapat diputar`}
        detail="Format ini tidak didukung browser. Video tetap tersimpan dan dapat diunduh."
        action={
          <a
            href={item.url}
            download
            className="mt-1 text-xs font-medium text-white/80 underline"
          >
            Unduh video
          </a>
        }
      />
    );
  }

  return (
    <video
      src={item.url}
      controls
      playsInline
      onError={() => setFailed(true)}
      className="max-h-full max-w-full"
    />
  );
}

function Unavailable({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-2 p-6 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[.12] font-bold text-white/80">
        !
      </span>
      <p className="text-[13px] font-semibold text-white/90">{title}</p>
      <p className="text-xs leading-relaxed text-white/60">{detail}</p>
      {action}
    </div>
  );
}

function StepButton({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/30 text-base text-white backdrop-blur-sm disabled:opacity-35"
    >
      {glyph}
    </button>
  );
}
