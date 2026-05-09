"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type GeneratedCarousel = {
  id: string;
  title: string;
  slideCount: number;
  pngUrls: string[];
  htmlSource: string;
};

export default function CarouselPage() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(7);
  const [loading, setLoading] = useState(false);
  const [carousel, setCarousel] = useState<GeneratedCarousel | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const result = await api.post("/api/carousel/generate", {
        topic,
        slideCount,
        vibeChoice: "last_used",
      });
      setCarousel(result.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Carousel Studio</h1>
          <p className="text-sm text-muted-foreground">Generate branded Instagram carousels with voice-matched slides.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImagePlus className="size-4" /> New carousel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="5 mistakes costing your salon bookings" />
            </div>
            <div className="space-y-2">
              <Label>Slides</Label>
              <Input
                type="number"
                min={5}
                max={10}
                value={slideCount}
                onChange={(event) => setSlideCount(Number(event.target.value))}
              />
            </div>
            <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {carousel ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {carousel.pngUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="aspect-[4/5] overflow-hidden border bg-muted">
                      <img src={url} alt={`Slide ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {carousel.title}, {carousel.slideCount} slides, ready for review.
                </div>
              </div>
            ) : (
              <div className="h-72 border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                Your generated slides will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
