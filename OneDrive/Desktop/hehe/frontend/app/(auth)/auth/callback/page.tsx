"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token && refresh) {
      setTokens({ accessToken: token, refreshToken: refresh });
      router.replace("/dashboard");
    } else {
      router.replace("/signin?error=oauth_failed");
    }
  }, [params, router, setTokens]);

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Signing in...
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Signing in...
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
