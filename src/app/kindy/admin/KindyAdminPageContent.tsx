"use client";

import { useEffect, useState } from "react";
import { kindyAdminApi, orgApi } from "@/lib/api";
import Dashboard from "./dashboard";

export default function KindyAdminPageContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Step 1: Server ping check
        await orgApi.ping();
        
        // Try to access WhatsApp tasks to check if already authenticated
        try {
          await kindyAdminApi.getWhatsAppTasks();
          setIsAuthenticated(true);
        } catch (authErr) {
          // Not authenticated yet
          setIsAuthenticated(false);
        }
      } catch (serverErr) {
        setError("sorry. server is busy.");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("jah");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await kindyAdminApi.login(password);
      setIsAuthenticated(true);
    } catch (loginErr: any) {
      setError(loginErr.message || "Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-sm bg-base-100 shadow-xl">
          <div className="card-body">
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-control">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Logging in...
                    </>
                  ) : (
                    "f"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}