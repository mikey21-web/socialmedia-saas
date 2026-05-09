"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  "Welcome",
  "Business",
  "Accounts",
  "Audience",
  "Goals",
  "Brand Voice",
  "Refine Voice",
  "Brand Look",
  "Schedule",
  "Activate",
];

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                  done && "bg-primary text-primary-foreground border-primary",
                  active && "border-primary text-primary bg-background",
                  !done && !active && "border-border text-muted-foreground bg-background"
                )}
              >
                {done ? "\u2713" : step}
              </div>
              <span
                className={cn(
                  "text-[11px] mt-1 hidden lg:block",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
