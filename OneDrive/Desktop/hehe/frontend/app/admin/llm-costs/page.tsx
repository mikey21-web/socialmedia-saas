"use client";

import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const costs = [
  { model: "groq:llama-3.3-70b-versatile", agent: "Copywriter", cost: "$8.34" },
  { model: "anthropic:claude-sonnet-4-6", agent: "Strategist", cost: "$21.10" },
  { model: "anthropic:claude-sonnet-4-6", agent: "Analyst", cost: "$12.42" },
];

export default function AdminLlmCostsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
        <DollarSign className="size-5" /> LLM Costs
      </h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Daily breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {costs.map((row) => (
            <div key={`${row.model}-${row.agent}`} className="grid gap-3 md:grid-cols-3 text-sm border-b pb-2 last:border-0">
              <span className="font-medium">{row.model}</span>
              <span>{row.agent}</span>
              <span>{row.cost}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
