"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import KindyStudentPageContent from "./KindyStudentPageContent";

export default function KindyStudentPage() {
  return (
    <Suspense fallback={<Spinner variant="page" label="Loading..." />}>
      <KindyStudentPageContent />
    </Suspense>
  );
}
