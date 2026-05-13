"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Standardized data-fetching hook with loading, error, and refetch states.
 * Use this in place of raw useEffect + api.get patterns.
 */
export function useApi<T>(
  url: string,
  options: { enabled?: boolean; params?: Record<string, unknown> } = {},
): UseApiResult<T> {
  const { enabled = true, params } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(url, { params });
      setData(response.data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Failed to load";
      setError(new Error(typeof message === "string" ? message : "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [url, enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export interface UseMutationResult<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput | null>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Standardized mutation hook for POST/PATCH/DELETE operations.
 */
export function useMutation<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
): UseMutationResult<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (input: TInput): Promise<TOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn(input);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? "Action failed";
      setError(new Error(typeof message === "string" ? message : "Action failed"));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, loading, error, reset };
}
