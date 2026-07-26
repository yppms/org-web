"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "yppms-theme";

/**
 * Light/dark theme switch. Toggles the `dark` class on <html> and persists to
 * localStorage. The initial class is applied by the no-FOUC script in
 * layout.tsx before paint; this component syncs its visual state on mount.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Mode gelap"
      aria-label="Ganti mode terang/gelap"
      className={`flex h-[22px] w-10 shrink-0 items-center rounded-full border p-0.5 transition-colors ${
        dark
          ? "border-transparent bg-primary"
          : "border-border bg-muted-foreground/40"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-card text-[11px] leading-none text-card-foreground shadow-sm transition-transform ${
          dark ? "translate-x-[18px]" : "translate-x-0"
        }`}
      >
        {dark ? "☾" : "☀"}
      </span>
    </button>
  );
}
