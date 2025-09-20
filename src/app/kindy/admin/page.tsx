"use client";

import { Suspense } from "react";
import KindyAdminPageContent from "./KindyAdminPageContent";

export default function KindyAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    }>
      <KindyAdminPageContent />
    </Suspense>
  );
}