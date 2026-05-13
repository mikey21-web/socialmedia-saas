"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 0, label: "Auto-Setup", path: "/onboarding/step-0" },
  { id: 1, label: "Welcome", path: "/onboarding/step-1" },
  { id: 2, label: "Business", path: "/onboarding/step-2" },
  { id: 3, label: "Accounts", path: "/onboarding/step-3" },
  { id: 4, label: "Audience", path: "/onboarding/step-4" },
  { id: 5, label: "Goals", path: "/onboarding/step-5" },
  { id: 6, label: "Brand Voice", path: "/onboarding/step-6" },
  { id: 7, label: "Refine Voice", path: "/onboarding/step-7" },
  { id: 8, label: "Brand Look", path: "/onboarding/step-8" },
  { id: 9, label: "Schedule", path: "/onboarding/step-9" },
  { id: 10, label: "Activate", path: "/onboarding/step-10" },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <Card className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">AI Agency Onboarding</h1>
      <p className="text-sm text-muted-foreground">
        Complete all 10 steps to set up your AI agency.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {STEPS.map(({ id, label, path }) => (
          <Button
            key={id}
            variant="outline"
            onClick={() => router.push(path)}
            className="justify-start"
          >
            <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mr-2">
              {id}
            </span>
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
