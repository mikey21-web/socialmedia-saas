"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useDashboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === "c") {
        e.preventDefault();
        router.push("/posts/new");
      } else if (e.key === "g") {
        const onSecond = (e2: KeyboardEvent) => {
          if (e2.key === "d") router.push("/dashboard");
          if (e2.key === "p") router.push("/posts");
          if (e2.key === "a") router.push("/analytics");
          window.removeEventListener("keydown", onSecond);
        };
        window.addEventListener("keydown", onSecond);
        setTimeout(() => window.removeEventListener("keydown", onSecond), 1500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
