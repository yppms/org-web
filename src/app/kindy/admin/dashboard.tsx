"use client";

import { useState, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";
import { Spinner } from "@/components/ui";
import Navigation from "./components/Navigation";
import PaymentSection from "./components/PaymentSection";
import InvoiceSection from "./components/InvoiceSection";
import StampSection from "./components/StampSection";
import OpenAsSection from "./components/OpenAsSection";
import SavingSection from "./components/SavingSection";
import InfaqSection from "./components/InfaqSection";
import OutstandingSection from "./components/OutstandingSection";
import SetorSection from "./components/SetorSection";
type Section = "payment" | "invoice" | "stamp" | "openas" | "saving" | "infaq" | "outstanding" | "setor";

interface SectionConfig {
  key: Section;
  endpoint: string;
}

const allSections: SectionConfig[] = [
  { key: "payment", endpoint: "/kindy/admin/payment" },
  { key: "invoice", endpoint: "/kindy/admin/invoice" },
  { key: "outstanding", endpoint: "/kindy/admin/student/outstanding" },
  { key: "saving", endpoint: "/kindy/admin/student/saving" },
  { key: "infaq", endpoint: "/kindy/admin/student/infaq" },
  { key: "setor", endpoint: "/kindy/admin/setor" },
  { key: "stamp", endpoint: "/kindy/admin/wa" },
  { key: "openas", endpoint: "/kindy/admin/student" },
];

export default function KindyAdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [accessibleSections, setAccessibleSections] = useState<Section[]>([]);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAllAccess = async () => {
      setIsCheckingAccess(true);
      
      const accessChecks = await Promise.all(
        allSections.map(async (section) => {
          const hasAccess = await kindyAdminApi.checkEndpointAccess(section.endpoint);
          return hasAccess ? section.key : null;
        })
      );

      const accessible = accessChecks.filter((key): key is Section => key !== null);
      setAccessibleSections(accessible);

      // Set first accessible section as active
      if (accessible.length > 0) {
        setActiveSection(accessible[0]);
      }

      setIsCheckingAccess(false);
    };

    checkAllAccess();
  }, []);

  // Don't render anything until we've checked access
  if (isCheckingAccess) {
    return <Spinner variant="page" label="Memuat portal..." />;
  }

  // If no sections are accessible, show error
  if (accessibleSections.length === 0) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Tidak Ada Akses</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda tidak memiliki akses ke bagian mana pun
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      <Navigation
        activeSection={activeSection!}
        onSectionChange={setActiveSection}
        accessibleSections={accessibleSections}
      />

      <main className="w-full overflow-x-hidden p-5">
        {activeSection === "payment" && accessibleSections.includes("payment") && <PaymentSection />}
        {activeSection === "invoice" && accessibleSections.includes("invoice") && <InvoiceSection />}
        {activeSection === "outstanding" && accessibleSections.includes("outstanding") && <OutstandingSection />}
        {activeSection === "stamp" && accessibleSections.includes("stamp") && <StampSection />}
        {activeSection === "openas" && accessibleSections.includes("openas") && <OpenAsSection />}
        {activeSection === "saving" && accessibleSections.includes("saving") && <SavingSection />}
        {activeSection === "infaq" && accessibleSections.includes("infaq") && <InfaqSection />}
        {activeSection === "setor" && accessibleSections.includes("setor") && <SetorSection />}
      </main>
    </div>
  );
}
