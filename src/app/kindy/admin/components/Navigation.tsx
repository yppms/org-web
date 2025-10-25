"use client";

type Section = "payment" | "invoice" | "stamp" | "openas" | "saving" | "infaq" | "outstanding";

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  accessibleSections: Section[];
}

interface NavItem {
  key: Section;
  label: string;
  icon: string;
}

export default function Navigation({
  activeSection,
  onSectionChange,
  accessibleSections,
}: NavigationProps) {
  const allItems: NavItem[] = [
    { key: "payment", label: "Payment", icon: "💰" },
    { key: "invoice", label: "Invoice", icon: "📄" },
    { key: "outstanding", label: "Standing", icon: "📊" },
    { key: "saving", label: "Saving", icon: "🏦" },
    { key: "infaq", label: "Infaq", icon: "🤲" },
    { key: "stamp", label: "Stamp", icon: "📨" },
    { key: "openas", label: "OAS", icon: "👤" },
  ];

  // Filter items to only show accessible sections
  const items = allItems.filter(item => accessibleSections.includes(item.key));

  return (
    <div className="bg-base-100 border-b border-base-300 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-base font-semibold">Kindy Admin Portal</h1>
          <p className="text-xs text-base-content/60">Miftahussalam Islamic Kindy</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key as Section)}
              className={`btn btn-sm gap-1.5 flex-1 min-w-[90px] ${
                activeSection === item.key
                  ? "btn-primary"
                  : "btn-ghost"
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

