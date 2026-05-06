import { api } from './api';

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const response = await api.post<{ url: string }>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { url } = response.data;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return url.startsWith('http') ? url : `${base}${url}`;
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await api.post<{ url: string }>('/media/generate', { prompt });
  return response.data.url;
}

export async function generateVideo(prompt: string): Promise<string> {
  const response = await api.post<{ url: string }>('/media/generate-video', { prompt });
  return response.data.url;
}
