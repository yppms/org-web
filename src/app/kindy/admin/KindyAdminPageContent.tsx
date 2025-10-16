"use client";

import { useEffect, useState } from "react";
import { kindyAdminApi, orgApi } from "@/lib/api";
import Dashboard from "./dashboard";

export default function KindyAdminPageContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Step 1: Server ping check
        await orgApi.ping();
        
        // Try to access userto check if already authenticated
        try {
          await kindyAdminApi.getAllStudents();
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered w-full pr-12"
                    disabled={isLoading}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content transition-colors z-10 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                    "yey"
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