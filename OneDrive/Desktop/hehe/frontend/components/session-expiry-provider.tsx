"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSessionExpiry, type SessionExpiryReason } from "@/hooks/useSessionExpiry";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SessionExpiryContextValue = {
  logout: (reason?: SessionExpiryReason) => void;
};

const SessionExpiryContext = createContext<SessionExpiryContextValue | null>(null);

export function SessionExpiryProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const clearToken = useAuthStore((state) => state.clearToken);
  const [isExpiredOpen, setIsExpiredOpen] = useState(false);
  const router = useRouter();

  const logout = useCallback(
    (_reason: SessionExpiryReason = "unauthorized") => {
      clearToken();
      localStorage.removeItem("auth");
      setIsExpiredOpen(true);
    },
    [clearToken],
  );

  useSessionExpiry({ token, onExpire: logout });

  const value = useMemo(() => ({ logout }), [logout]);

  return (
    <SessionExpiryContext.Provider value={value}>
      {children}
      <Dialog open={isExpiredOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Session expired</DialogTitle>
            <DialogDescription>
              Your session expired. Please sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsExpiredOpen(false);
                router.replace("/signin");
              }}
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SessionExpiryContext.Provider>
  );
}

export function useSessionExpiryContext(): SessionExpiryContextValue {
  const context = useContext(SessionExpiryContext);
  if (!context) {
    throw new Error("useSessionExpiryContext must be used within SessionExpiryProvider");
  }
  return context;
}
