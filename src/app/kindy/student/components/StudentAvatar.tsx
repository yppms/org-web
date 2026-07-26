"use client";

import { useState } from "react";
import Image from "next/image";

interface StudentAvatarProps {
  name: string;
  url: string | null;
  /** Rendered diameter in px. */
  size: number;
  /** How many leading name words the initials fallback uses. */
  initialsWords?: number;
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

  if (url && !failed) {
    return (
      <Image
        src={url}
        alt={name}
        width={size * 2}
        height={size * 2}
        style={box}
        unoptimized
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover object-top ${className}`}
      />
    );
  }

  return (
    <div
      style={box}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${className}`}
    >
      {initials}
    </div>
  );
}
