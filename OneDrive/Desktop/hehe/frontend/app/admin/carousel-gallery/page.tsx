"use client";

import { Images } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCarouselGalleryPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal flex items-center gap-2">
        <Images className="size-5" /> Carousel Gallery
      </h1>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="aspect-[4/5] bg-muted border flex items-center justify-center text-sm text-muted-foreground">
                Carousel {index + 1}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
