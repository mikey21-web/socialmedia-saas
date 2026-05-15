"use client";
import { useEffect, useState } from "react";
import { useBrandStore } from "@/store/brand";
import { api } from "@/lib/api";

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const profile = useBrandStore((s) => s.profile);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ count: number }>("/posts/pending-count")
      .then((res) => setPending(res.data.count))
      .catch(() => setPending(0));
  }, []);

  const name = profile?.brandName?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1 className="text-xl font-semibold">{timeOfDay()}, {name}.</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {pending && pending > 0
          ? `${pending} post${pending === 1 ? "" : "s"} waiting for your approval.`
          : "All caught up. Brain has the room."}
      </p>
    </div>
  );
}
