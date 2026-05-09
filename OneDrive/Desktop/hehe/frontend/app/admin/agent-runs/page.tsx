"use client";

import { Activity, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  { agent: "Strategist", status: "succeeded", duration: "41s", cost: "$0.18" },
  { agent: "Copywriter", status: "succeeded", duration: "6s", cost: "$0.04" },
  { agent: "Engagement", status: "pending", duration: "2s", cost: "$0.01" },
];

export default function AdminAgentRunsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
        <Activity className="size-5" /> Agent Runs
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Runs today" value="128" icon={Activity} />
        <Metric title="Avg duration" value="8.4s" icon={Clock} />
        <Metric title="LLM cost" value="$14.20" icon={DollarSign} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div key={`${row.agent}-${row.duration}`} className="grid grid-cols-4 gap-3 text-sm border-b pb-2 last:border-0">
              <span className="font-medium">{row.agent}</span>
              <span>{row.status}</span>
              <span>{row.duration}</span>
              <span>{row.cost}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Activity }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Icon className="size-4" /> {title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-semibold">{value}</div></CardContent>
    </Card>
  );
}
