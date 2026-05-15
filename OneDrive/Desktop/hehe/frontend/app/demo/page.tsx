"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        state: { token: "demo-preview-token", refreshToken: "demo-refresh" },
        version: 0,
      }),
    );
    localStorage.setItem("onboardingComplete", "true");
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading preview...
      </div>
    </div>
  );
}
