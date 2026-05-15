import axios from "axios";
import { emitSessionUnauthorized } from "@/lib/session-events";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // malformed storage — ignore
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("auth");
        const token = raw ? (JSON.parse(raw) as { state?: { token?: string } })?.state?.token : null;
        if (token !== "demo-preview-token") emitSessionUnauthorized();
      } catch {
        emitSessionUnauthorized();
      }
    }
    return Promise.reject(err);
  }
);
