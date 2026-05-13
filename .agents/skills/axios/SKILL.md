---
name: axios
description: Make HTTP requests with Axios in JavaScript/TypeScript. Use when using axios for API calls, configuring interceptors, handling errors, uploading files, setting up base instances, or implementing retry logic with Axios.
---

# Axios Expert Guide

## Setup

```bash
npm install axios
```

## Basic Usage

```typescript
import axios from 'axios'

// GET
const { data } = await axios.get<User>('/api/users/1')

// POST
const { data } = await axios.post<User>('/api/users', {
  name: 'Alice',
  email: 'alice@example.com',
})

// PUT / PATCH / DELETE
await axios.put('/api/users/1', updateData)
await axios.patch('/api/users/1', { name: 'Updated' })
await axios.delete('/api/users/1')
```

## Axios Instance (recommended for real apps)

```typescript
// lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: add auth token
api.interceptors.request.use((config) => {
  const token = getTokenFromStorage()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token or redirect to login
      await refreshToken()
      return api.request(error.config)  // retry original request
    }
    if (error.response?.status === 429) {
      // Rate limited — retry after delay
      const retryAfter = error.response.headers['retry-after'] || 5
      await delay(retryAfter * 1000)
      return api.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

## Error Handling

```typescript
import axios, { AxiosError } from 'axios'

try {
  const { data } = await api.get('/users')
  return data
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    if (status === 404) throw new NotFoundError(message)
    if (status === 422) throw new ValidationError(error.response?.data?.errors)
    if (status === 500) throw new ServerError(message)
    if (error.request) throw new NetworkError('No response from server')
  }
  throw error
}
```

## Request Configuration

```typescript
const { data } = await api.get('/users', {
  params: { page: 1, limit: 20, search: 'alice' },  // → ?page=1&limit=20&search=alice
  headers: { 'X-Custom-Header': 'value' },
  timeout: 5000,
  signal: abortController.signal,  // cancelation
})

// Cancel request
const controller = new AbortController()
const request = api.get('/users', { signal: controller.signal })
controller.abort()  // cancel
```

## File Upload

```typescript
// Single file
const formData = new FormData()
formData.append('file', file)
formData.append('userId', userId)

const { data } = await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total!)
    setProgress(percent)
  },
})

// Multiple files
files.forEach(file => formData.append('files', file))
```

## TypeScript Generic Responses

```typescript
interface ApiResponse<T> {
  data: T
  meta: { total: number; page: number; limit: number }
}

interface User {
  id: string
  name: string
  email: string
}

// Typed response
const { data } = await api.get<ApiResponse<User[]>>('/users')
// data.data is User[], data.meta has pagination
```

## Parallel Requests

```typescript
// All must succeed
const [users, posts, analytics] = await Promise.all([
  api.get<User[]>('/users'),
  api.get<Post[]>('/posts'),
  api.get<Analytics>('/analytics'),
])

// Some can fail
const results = await Promise.allSettled([
  api.get('/critical'),
  api.get('/optional'),
])
results.forEach(result => {
  if (result.status === 'fulfilled') use(result.value.data)
  else handleError(result.reason)
})
```

## Retry Logic

```typescript
import axiosRetry from 'axios-retry'

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,  // 1s, 2s, 4s
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 503,
})

// Or manual retry
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await api.get(url)
      return data
    } catch (error) {
      if (i === retries - 1 || !isRetryableError(error)) throw error
      await delay(1000 * Math.pow(2, i))
    }
  }
}
```

## Fetch API vs Axios

| Feature | fetch | axios |
|---------|-------|-------|
| Bundle size | 0 (built-in) | ~13KB |
| Auto JSON parse | ❌ manual | ✅ |
| Interceptors | ❌ manual | ✅ |
| Request timeout | ❌ AbortController | ✅ timeout: ms |
| Upload progress | ❌ | ✅ onUploadProgress |
| Error on 4xx/5xx | ❌ only network | ✅ throws |
| Node.js support | ✅ (18+) | ✅ |

**Use fetch** for simple Next.js Server Components (better caching integration).
**Use axios** for complex client-side apps with interceptors and error handling.
