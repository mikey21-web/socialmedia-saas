"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Camera, Clapperboard, FileText, Filter, Loader2, Music, Play, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";

/* ─── Types matching backend ────────────────────────────────────────────── */

interface ReelTemplate {
  id: string;
  slug: string;
  title: string;
  category: string;
  vertical: string;
  goal: string;
  difficulty: string;
  estDurationSec: number;
  shotCount: number;
  engagementTier: string;
  language: string;
  tags: string[];
  audioMood: string[];
  thumbnailUrl?: string;
}

interface ReelScript {
  id: string;
  title: string;
  topic: string;
  vertical: string;
  status: string;
  totalDuration: number;
  hook: string;
  createdAt: string;
}

const VERTICALS = [
  { value: "all", label: "All industries" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "real_estate", label: "Real Estate" },
  { value: "fitness", label: "Fitness / Gym" },
  { value: "d2c", label: "D2C / E-commerce" },
  { value: "clinic", label: "Clinic / Doctor" },
  { value: "coach", label: "Coach / Consultant" },
  { value: "education", label: "Education" },
  { value: "tech", label: "Tech / SaaS" },
  { value: "generic", label: "General" },
];

const CATEGORY_LABELS: Record<string, string> = {
  product_showcase: "Product Showcase",
  bts: "Behind the Scenes",
  educational: "Educational",
  before_after: "Before/After",
  founder_story: "Founder Story",
  testimonial: "Testimonial",
  trend_riding: "Trend",
  day_in_life: "Day in Life",
  promo: "Promo",
  comparison: "Comparison",
  tutorial: "Tutorial",
  story: "Story",
};

const GOAL_LABELS: Record<string, string> = {
  awareness: "Awareness",
  conversion: "Get sales",
  engagement: "Get likes & comments",
  trust: "Build trust",
  educate: "Teach something",
  entertain: "Entertain",
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function ReelsPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "scripts" | "calendar">("templates");
  const [templates, setTemplates] = useState<ReelTemplate[]>([]);
  const [scripts, setScripts] = useState<ReelScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Load data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/agency/reel-studio/templates", {
        params: {
          ...(selectedVertical !== "all" && { vertical: selectedVertical }),
          ...(selectedCategory !== "all" && { category: selectedCategory }),
        },
      }),
      api.get("/agency/reel-studio/scripts"),
    ])
      .then(([t, s]) => {
        setTemplates(t.data ?? []);
        setScripts(s.data ?? []);
      })
      .catch(() => {
        setTemplates([]);
        setScripts([]);
      })
      .finally(() => setLoading(false));
  }, [selectedVertical, selectedCategory]);

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  const grouped = useMemo(() => {
    const map: Record<string, ReelTemplate[]> = {};
    for (const t of filtered) {
      (map[t.category] ??= []).push(t);
    }
    return map;
  }, [filtered]);

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clapperboard className="size-6 text-violet-500" />
            Reel Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Don't know what to film? Pick a proven Reel format below. We'll write the hook, shot list,
            captions, and hashtags. You just point your phone and shoot.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="size-3.5 mr-1.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="scripts">
            <Wand2 className="size-3.5 mr-1.5" />
            My Scripts {scripts.length > 0 && <span className="ml-1 text-xs opacity-60">({scripts.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="size-3.5 mr-1.5" />
            30-Day Calendar
          </TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search templates by name or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={selectedVertical} onValueChange={(v) => v && setSelectedVertical(v)}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={(v) => v && setSelectedCategory(v)}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick start banner */}
          <Card className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border-violet-500/30">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="size-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">First time? Start here.</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick your industry above, then click any "easy" template. We'll generate the full script
                    for you in 10 seconds — hook, shot list, captions, everything.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <EmptyState
              icon={Filter}
              title="No templates match these filters"
              description="Try changing your industry or category, or clear the search."
            />
          )}

          {/* Grouped by category */}
          {!loading && Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((t) => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        {/* SCRIPTS TAB */}
        <TabsContent value="scripts" className="space-y-4">
          {scripts.length === 0 ? (
            <EmptyState
              icon={Wand2}
              title="No scripts yet"
              description="Generate your first script from any template. It takes 10 seconds."
              action={
                <Button onClick={() => setActiveTab("templates")}>
                  Browse Templates
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {scripts.map((s) => (
                <ScriptCard key={s.id} script={s} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar">
          <CalendarTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function TemplateCard({ template }: { template: ReelTemplate }) {
  const tierColor =
    template.engagementTier === "high"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : template.engagementTier === "medium"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

  return (
    <Link href={`/reels/template/${template.id}`}>
      <Card className="group hover:border-violet-500/50 transition-all cursor-pointer h-full">
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="size-9 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
              <Camera className="size-4 text-violet-400" />
            </div>
            <Badge variant="outline" className={tierColor}>
              {template.engagementTier === "high" ? "🔥 high engagement" : template.engagementTier}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-violet-400 transition-colors">
              {template.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {GOAL_LABELS[template.goal]} • {template.estDurationSec}s • {template.shotCount} shots
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {template.difficulty}
            </Badge>
            {template.audioMood.slice(0, 2).map((m) => (
              <Badge key={m} variant="outline" className="text-[10px] px-1.5 py-0">
                <Music className="size-2.5 mr-0.5" />
                {m}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ScriptCard({ script }: { script: ReelScript }) {
  const statusColor: Record<string, string> = {
    draft: "bg-zinc-500/15 text-zinc-400",
    filming: "bg-amber-500/15 text-amber-400",
    ready: "bg-blue-500/15 text-blue-400",
    published: "bg-green-500/15 text-green-400",
  };

  return (
    <Link href={`/reels/scripts/${script.id}`}>
      <Card className="hover:border-violet-500/50 transition-all cursor-pointer">
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug">{script.title}</h3>
            <Badge variant="outline" className={statusColor[script.status] ?? statusColor.draft}>
              {script.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">"{script.hook}"</p>
          <div className="text-xs text-muted-foreground">
            {script.totalDuration}s • {new Date(script.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CalendarTab() {
  const [vertical, setVertical] = useState<string>("salon");
  const [calendar, setCalendar] = useState<{ entries: Array<{ day: number; topic: string; hook: string; templateId?: string; notes?: string }> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function loadCalendar() {
    setLoading(true);
    try {
      const r = await api.get("/agency/reel-studio/calendar/current", {
        params: { vertical },
      });
      setCalendar(r.data);
    } catch {
      setCalendar(null);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setGenerating(true);
    const now = new Date();
    try {
      const r = await api.post("/agency/reel-studio/calendar/generate", {
        vertical,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      setCalendar(r.data);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={vertical} onValueChange={(v) => v && setVertical(v)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERTICALS.filter(v => v.value !== "all").map((v) => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={regenerate} disabled={generating}>
          {generating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Sparkles className="size-4 mr-1.5" />}
          {calendar ? "Regenerate" : "Generate"} Calendar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">30-Day Reel Calendar</CardTitle>
          <CardDescription>
            Ready-to-film ideas with hook lines for each day. Click any to generate a full script.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !calendar || !calendar.entries?.length ? (
            <EmptyState
              icon={Calendar}
              title="No calendar yet"
              description="Click Generate to get 30 days of Reel ideas tailored to your industry."
            />
          ) : (
            <div className="space-y-2">
              {calendar.entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-md border border-border/50 hover:border-violet-500/30 transition-colors"
                >
                  <div className="size-10 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold">D{entry.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{entry.topic}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">"{entry.hook}"</p>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{entry.notes}</p>
                    )}
                  </div>
                  {entry.templateId && (
                    <Link href={`/reels/template/${entry.templateId}?topic=${encodeURIComponent(entry.topic)}`}>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Wand2 className="size-3 mr-1" />
                        Generate Script
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
