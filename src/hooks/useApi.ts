"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, ApiResponse } from "@/lib/api";

interface UseApiOptions {
  /** Re-run the fetch when any of these change. Defaults to run-once. */
  deps?: unknown[];
  /** Message shown when the error is not an ApiError (network/unknown). */
  fallbackMessage?: string;
  /** Skip the automatic fetch on mount (call refetch() manually). */
  skip?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** Re-run the fetcher. Returns the fresh data (or null on error). */
  refetch: () => Promise<T | null>;
}

/**
 * Standard data-fetching hook. Replaces the copy-pasted
 * `useState(loading/error/data) + useEffect + instanceof ApiError` block.
 *
 *   const { data, isLoading, error, refetch } = useApi(
 *     () => kindyStudentApi.getInfaq(),
 *     { fallbackMessage: "Gagal memuat data infaq" }
 *   );
 *
 * `data` is the unwrapped `response.data`. Errors are normalised to a string
 * (backend `ApiError.message`, else `fallbackMessage`).
 */
export function useApi<T = unknown>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { deps = [], fallbackMessage = "Terjadi kesalahan. Coba lagi.", skip = false } =
    options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      const value = (response.data ?? null) as T | null;
      setData(value);
      return value;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : fallbackMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
    // fetcher is intentionally excluded — callers pass an inline closure whose
    // identity changes every render; `deps` is the explicit dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (skip) return;
    run();
  }, [run, skip]);

  return { data, isLoading, error, refetch: run };
}

export default useApi;
