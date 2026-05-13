"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (!token || !refresh) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    setTokens({ accessToken: token, refreshToken: refresh });
    router.replace("/dashboard");
  }, [router, setTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Completing Google sign-in...
          </div>
        )}
      </div>
    </div>
  );
}
