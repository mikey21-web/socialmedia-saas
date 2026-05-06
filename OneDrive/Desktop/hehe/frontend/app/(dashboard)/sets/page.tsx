"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePostsetsStore } from "@/store/postsets";

interface PostInSet {
  id: string;
  title: string;
  content: string;
}

interface PostSetDetail {
  id: string;
  name: string;
  description: string | null;
  posts: PostInSet[];
}

export default function SetsPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<PostSetDetail | null>(null);

  const sets = usePostsetsStore((s) => s.sets);
  const loading = usePostsetsStore((s) => s.loading);
  const fetchSets = usePostsetsStore((s) => s.fetchSets);
  const createSet = usePostsetsStore((s) => s.createSet);
  const deleteSet = usePostsetsStore((s) => s.deleteSet);

  useEffect(() => {
    void fetchSets();
  }, [fetchSets]);

  useEffect(() => {
    async function fetchSetDetail() {
      if (!selectedSetId) {
        setSelectedSet(null);
        return;
      }
      const response = await api.get<PostSetDetail>(`/postsets/${selectedSetId}`);
      setSelectedSet(response.data);
    }

    void fetchSetDetail();
  }, [selectedSetId]);

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-semibold">Posting Sets</h1>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Create Set</h2>
        <input
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
          placeholder="Set name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          disabled={!canCreate}
          onClick={() => void createSet(name.trim(), description.trim() || undefined).then(() => {
            setName("");
            setDescription("");
          })}
        >
          Create Set
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">All Sets</h2>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {sets.map((setItem) => (
            <div key={setItem.id} className="flex items-center justify-between gap-2 border border-border rounded-md p-2">
              <button
                type="button"
                className="text-left flex-1"
                onClick={() => setSelectedSetId(setItem.id)}
              >
                <p className="text-sm font-medium">{setItem.name}</p>
                {setItem.description && <p className="text-xs text-muted-foreground">{setItem.description}</p>}
              </button>
              <button type="button" className="text-xs text-destructive" onClick={() => void deleteSet(setItem.id)}>Delete</button>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Set Posts</h2>
          {!selectedSet && <p className="text-sm text-muted-foreground">Select a set to view posts.</p>}
          {selectedSet && (
            <>
              <p className="text-sm font-medium">{selectedSet.name}</p>
              {selectedSet.posts.length === 0 && <p className="text-sm text-muted-foreground">No posts in this set yet.</p>}
              {selectedSet.posts.map((post) => (
                <div key={post.id} className="border border-border rounded-md p-2">
                  <p className="text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
