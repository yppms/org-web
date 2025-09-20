"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import kindyStudentApi, { orgApi } from "@/lib/api";
import Dashboard from "./dashboard";

export default function KindyStudentPageContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        // Step 1: Server ping check
        await orgApi.ping();

        const stamp = searchParams.get("stamp");

        if (!stamp) {
          try {
            await kindyStudentApi.getProfile();
            setIsAuthenticated(true);
            return;
          } catch (profileErr) {
            setError("need stamp, please open with original link.");
            setIsAuthenticated(false);
            return;
          }
        }

        try {
          await kindyStudentApi.login(stamp);
          setIsAuthenticated(true);
          
          // Strip out the stamp parameter from URL after successful authentication
          const url = new URL(window.location.href);
          url.searchParams.delete("stamp");
          router.replace(url.pathname + url.search);
        } catch (loginErr) {
          setError("access is limited, you should chat admin.");
          setIsAuthenticated(false);
        }
      } catch (serverErr) {
        setError("sorry. server is busy.");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh]">
        {/* Hero Section */}
        <div className="hero min-h-screen">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-lg font-bold">
                {error || "sorry you don't have access."}
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
