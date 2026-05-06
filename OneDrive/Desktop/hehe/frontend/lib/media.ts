import { api } from "./api";

export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  source: "upload" | "generated";
  tags: string[];
  createdAt: string;
}

type MediaResponse = {
  url: string;
  asset: MediaAsset;
};

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<MediaResponse>("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.url;
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await api.post<MediaResponse>("/media/generate", { prompt });
  return response.data.url;
}

export async function generateVideo(prompt: string): Promise<string> {
  const response = await api.post<MediaResponse>("/media/generate-video", { prompt });
  return response.data.url;
}
