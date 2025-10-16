"use client";

import { useState, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";
import Navigation from "./components/Navigation";
import PaymentSection from "./components/PaymentSection";
import InvoiceSection from "./components/InvoiceSection";
import StampSection from "./components/StampSection";
import OpenAsSection from "./components/OpenAsSection";
import SavingSection from "./components/SavingSection";
import InfaqSection from "./components/InfaqSection";

type Section = "payment" | "invoice" | "stamp" | "openas" | "saving" | "infaq";

interface SectionConfig {
  key: Section;
  endpoint: string;
}

const allSections: SectionConfig[] = [
  { key: "payment", endpoint: "/kindy/admin/payment" },
  { key: "invoice", endpoint: "/kindy/admin/invoice" },
  { key: "saving", endpoint: "/kindy/admin/student/saving" },
  { key: "infaq", endpoint: "/kindy/admin/student/infaq" },
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
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">Loading portal...</p>
        </div>
      </div>
    );
  }

  // If no sections are accessible, show error
  if (accessibleSections.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-base-content/70">No Access</p>
          <p className="mt-2 text-sm text-base-content/60">
            You don&apos;t have permission to access any sections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navigation 
        activeSection={activeSection!} 
        onSectionChange={setActiveSection}
        accessibleSections={accessibleSections}
      />
      
      <div className="max-w-4xl mx-auto">
        {activeSection === "payment" && accessibleSections.includes("payment") && <PaymentSection />}
        {activeSection === "invoice" && accessibleSections.includes("invoice") && <InvoiceSection />}
        {activeSection === "stamp" && accessibleSections.includes("stamp") && <StampSection />}
        {activeSection === "openas" && accessibleSections.includes("openas") && <OpenAsSection />}
        {activeSection === "saving" && accessibleSections.includes("saving") && <SavingSection />}
        {activeSection === "infaq" && accessibleSections.includes("infaq") && <InfaqSection />}
      </div>
    </div>
  );
}
