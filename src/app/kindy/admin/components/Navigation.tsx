"use client";

import ThemeToggle from "@/components/ThemeToggle";

type Section =
  | "payment"
  | "invoice"
  | "stamp"
  | "openas"
  | "saving"
  | "infaq"
  | "outstanding"
  | "setor";

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  accessibleSections: Section[];
}

const allItems: { key: Section; label: string }[] = [
  { key: "payment", label: "Bayar" },
  { key: "invoice", label: "Tagihan" },
  { key: "outstanding", label: "Tunggakan" },
  { key: "saving", label: "Tabungan" },
  { key: "infaq", label: "Infaq" },
  { key: "setor", label: "Setor" },
  { key: "stamp", label: "Stamp" },
  { key: "openas", label: "Buka" },
];

export default function Navigation({
  activeSection,
  onSectionChange,
  accessibleSections,
}: NavigationProps) {
  const items = allItems.filter((item) =>
    accessibleSections.includes(item.key)
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="px-5 pt-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold">Portal Admin Kindy</h1>
            <p className="text-xs text-muted-foreground">
              Miftahussalam Islamic Kindy
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto pb-2.5">
          {items.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`h-[30px] shrink-0 whitespace-nowrap rounded-lg px-3 text-[13px] transition-colors ${
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
      </div>
    </header>
  );
}
