"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

export default function AgencyOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setBusinessInfo = useOnboardingStore((s) => s.setBusinessInfo);

  useEffect(() => {
    const vertical = searchParams.get("vertical");
    if (vertical) {
      setBusinessInfo({ vertical });
    }
    router.replace("/onboarding/step-2");
  }, [searchParams, setBusinessInfo, router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
