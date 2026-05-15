"use client";
import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

export function CountUp({ value, duration = 0.8, format = (n: number) => n.toLocaleString() }: { value: number; duration?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const controls = animate(prev.current, value, {
      duration,
      onUpdate: (n) => {
        if (ref.current) ref.current.textContent = format(Math.round(n));
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, format]);

  return <span ref={ref}>{format(value)}</span>;
}
