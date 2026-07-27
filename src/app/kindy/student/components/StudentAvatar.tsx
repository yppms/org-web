"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StudentAvatarProps {
  name: string;
  url: string | null;
  /** Rendered diameter in px. */
  size: number;
  /** How many leading name words the initials fallback uses. */
  initialsWords?: number;
  /** Wraps the photo in the brand conic-gradient ring (profile treatment). */
  ring?: boolean;
  /** Pill pinned below the photo, e.g. "Mas Zaki". Needs `ring`. */
  badge?: string | null;
  /** Makes the whole thing a button — used to open the photo fullscreen. */
  onClick?: () => void;
  className?: string;
}

/**
 * Profile photo, or the student's initials when there is none. The URL is a
 * short-lived SAS link from the API, so a stale one falls back to initials
 * rather than a broken image. Photos are already downscaled server-side —
 * `unoptimized` keeps Next from re-fetching a signed URL that changes on
 * every load.
 */
export default function StudentAvatar({
  name,
  url,
  size,
  initialsWords = 2,
  ring = false,
  badge = null,
  onClick,
  className = "",
}: StudentAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, initialsWords)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const box = { width: size, height: size };

  const photo =
    url && !failed ? (
      <Image
        src={url}
        alt={name}
        width={size * 2}
        height={size * 2}
        style={{
          ...box,
          // A 3px card-coloured gap so the ring reads as a ring, not a border.
          boxShadow: ring ? "0 0 0 3px rgb(var(--card))" : undefined,
        }}
        unoptimized
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 rounded-full object-cover object-top",
          className,
        )}
      />
    ) : (
      <div
        style={{
          ...box,
          boxShadow: ring ? "0 0 0 3px rgb(var(--card))" : undefined,
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
          className,
        )}
      >
        {initials}
      </div>
    );

  // Plain, non-interactive avatar (the common case).
  if (!ring && !onClick) return photo;

  const content = (
    <>
      {photo}
      {ring && badge && (
        <span className="absolute -bottom-1.5 left-1/2 inline-flex -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-[0_0_0_2px_rgb(var(--card))]">
          {badge}
        </span>
      )}
    </>
  );

  const ringStyle = ring
    ? {
        // Not expressible as a utility — a three-stop conic sweep whose ends
        // meet at the brand green so the ring has no visible seam.
        background:
          "conic-gradient(from 210deg, rgb(var(--primary)), oklch(0.85 0.12 150), rgb(var(--primary)))",
        padding: 5,
      }
    : undefined;

  if (!onClick) {
    return (
      <div
        style={ringStyle}
        className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Lihat foto"
      aria-label={`Foto ${name}`}
      style={ringStyle}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full transition-transform",
        ring
          ? "hover:scale-[1.03]"
          : "shadow-[0_0_0_2px_rgb(var(--border))] transition-shadow hover:shadow-[0_0_0_2px_rgb(var(--primary))]",
      )}
    >
      {content}
    </button>
  );
}
