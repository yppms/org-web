"use client";

import { type ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";

interface ActivityRowProps {
  title: string;
  /** Date (or date range) shown in muted text beside the title. */
  date?: string;
  /** Optional muted line below the title. */
  sub?: string;
  amount: string;
  badge: string;
  badgeVariant?: BadgeProps["variant"];
  /** Optional always-visible compact detail block under the row. */
  extra?: ReactNode;
}

/** One compact row in the student "Aktivitas" list. */
export default function ActivityRow({
  title,
  date,
  sub,
  amount,
  badge,
  badgeVariant = "default",
  extra,
}: ActivityRowProps) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-sm font-medium">{title}</p>
            {date && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {date}
              </span>
            )}
          </div>
          {sub && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {sub}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-[13px] font-semibold">{amount}</span>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
      </div>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
}
