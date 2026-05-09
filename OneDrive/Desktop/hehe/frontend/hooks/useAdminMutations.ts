"use client";

import { api } from "@/lib/api";

export function useAdminMutations() {
  return {
    create: (path: string, body: unknown) => api.post(path, body).then((response) => response.data),
    update: (path: string, body: unknown) => api.patch(path, body).then((response) => response.data),
    remove: (path: string) => api.delete(path).then((response) => response.data),
    action: (path: string, body?: unknown) => api.post(path, body ?? {}).then((response) => response.data),
  };
}
