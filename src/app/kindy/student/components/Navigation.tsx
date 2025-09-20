"use client";

type Section =
  | "dashboard"
  | "profile"
  | "invoices"
  | "savings"
  | "infaq"
  | "fullday";

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  studentName: string;
}

export default function Navigation({
  activeSection,
  onSectionChange,
  studentName,
}: NavigationProps) {
  const mainItems = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "profile", label: "Profil", icon: "👨‍🦲" },
  ];

  return (
    <>
      {/* Top Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-40 rounded-b-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {studentName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xs">
                  Miftahussalam Kindy Portal 👋
                </h1>
                <p className="text-base-content/60 font-semibold text-sm leading-none mt-1">
                  {studentName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[425px]">
        <div className="px-4 py-2 safe-area-bottom">
          <div className="flex justify-center">
            <div className="flex bg-base-100 rounded-2xl p-1 gap-1">
              {mainItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onSectionChange(item.key as Section)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeSection === item.key
                      ? "bg-primary text-primary-content shadow-sm"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-xs font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
