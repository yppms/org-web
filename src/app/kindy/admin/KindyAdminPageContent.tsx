"use client";

import { useEffect, useState } from "react";
import { kindyAdminApi, orgApi, ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Spinner, ErrorAlert, Button, Input, Label } from "@/components/ui";
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
        setError("Maaf, server sedang sibuk.");
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
      setError("Masukkan kata sandi.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await kindyAdminApi.login(password);
      setIsAuthenticated(true);
    } catch (loginErr) {
      setError(loginErr instanceof ApiError ? loginErr.message : "Kata sandi salah");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner variant="page" label="Memuat..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <div className="w-full max-w-[360px] rounded-xl border border-border bg-card p-7 shadow-card">
          <h1 className="text-lg font-semibold">Portal Admin Kindy</h1>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Miftahussalam Islamic Kindy
          </p>
          <form onSubmit={handleLogin} className="flex flex-col gap-1.5">
            <Label htmlFor="admin-password">Kata sandi</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-16"
                disabled={isLoading}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-1.5 top-1/2 h-6 -translate-y-1/2 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                {showPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>

            {error && (
              <div className="mt-1">
                <ErrorAlert message={error} />
              </div>
            )}

            <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}