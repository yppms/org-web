"use client";

import ThemeToggle from "@/components/ThemeToggle";
import StudentAvatar from "./StudentAvatar";

export type StudentSection = "dashboard" | "profile";

interface NavigationProps {
  activeSection: StudentSection;
  onSectionChange: (section: StudentSection) => void;
  studentName: string;
  photoUrl?: string | null;
  subtitle?: string;
}

const navItems: { key: StudentSection; label: string }[] = [
  { key: "dashboard", label: "Keuangan" },
  { key: "profile", label: "Profil" },
];

export default function Navigation({
  activeSection,
  onSectionChange,
  studentName,
  photoUrl = null,
  subtitle = "TK IT Miftahussalam",
}: NavigationProps) {
  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-card/75 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <StudentAvatar
              name={studentName}
              url={photoUrl}
              size={36}
              initialsWords={1}
              className="text-sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {studentName}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-app -translate-x-1/2 bg-card/75 backdrop-blur-md">
        <div className="flex gap-1 px-3 pb-3 pt-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`h-9 flex-1 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-muted font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
