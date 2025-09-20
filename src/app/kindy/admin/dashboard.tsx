"use client";

import { useEffect, useState } from "react";
import { kindyAdminApi } from "@/lib/api";
import WhatsAppTasksList from "./components/WhatsAppTasksList";
interface WhatsAppTask {
  id: string;
  name: string;
  phone: string;
  key: string;
  wa_link: string;
  no: number;
}

export default function Dashboard() {
  const [whatsAppTasks, setWhatsAppTasks] = useState<WhatsAppTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWhatsAppTasks = async () => {
      try {
        const response = await kindyAdminApi.getWhatsAppTasks();
        setWhatsAppTasks(response.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load WhatsApp tasks");
      } finally {
        setIsLoading(false);
      }
    };

    loadWhatsAppTasks();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-base-200">

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {error ? (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        ) : (
          <WhatsAppTasksList tasks={whatsAppTasks} />
        )}
      </div>
    </div>
  );
}