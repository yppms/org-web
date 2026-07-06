"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import KindyAdminPageContent from "./KindyAdminPageContent";

export default function KindyAdminPage() {
  return (
    <Suspense fallback={<Spinner variant="page" label="Loading..." />}>
      <KindyAdminPageContent />
    </Suspense>
  );
}