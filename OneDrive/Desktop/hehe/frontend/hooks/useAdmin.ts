"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useAdmin<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(path)
      .then((response) => {
        if (active) setData(response.data as T);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, loading, error, setData };
}
