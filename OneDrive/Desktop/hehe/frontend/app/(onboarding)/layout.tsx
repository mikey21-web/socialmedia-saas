"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </AuthGuard>
  );
}
