"use client";

import { useEffect } from "react";
import { SESSION_UNAUTHORIZED_EVENT } from "@/lib/session-events";

export type SessionExpiryReason = "expired" | "unauthorized";

type UseSessionExpiryParams = {
  token: string | null;
  onExpire: (reason: SessionExpiryReason) => void;
};

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalizedPayload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };

    if (typeof decodedPayload.exp !== "number") {
      return null;
    }

    return decodedPayload.exp * 1000;
  } catch {
    return null;
  }
}

export function useSessionExpiry({ token, onExpire }: UseSessionExpiryParams): void {
  useEffect(() => {
    if (!token) {
      return;
    }

    const expiryTimestamp = decodeJwtExpiry(token);
    if (!expiryTimestamp) {
      return;
    }

    const triggerAt = expiryTimestamp - Date.now() - 60000;
    if (triggerAt <= 0) {
      onExpire("expired");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onExpire("expired");
    }, triggerAt);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [token, onExpire]);

  useEffect(() => {
    const onUnauthorized = () => {
      onExpire("unauthorized");
    };

    window.addEventListener(SESSION_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(SESSION_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [onExpire]);
}
