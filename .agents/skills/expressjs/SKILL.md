---
name: expressjs
description: Build Express.js REST APIs and web servers in Node.js. Use when creating Express routes/middleware, implementing authentication, handling errors, structuring Express apps, or connecting to databases with Express.
---

# Express.js Expert Guide

## App Setup

```typescript
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

const app = express()

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }))
app.use(helmet())
app.use(morgan('combined'))

// Routes
app.use('/api/users', userRouter)
app.use('/api/posts', postRouter)

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// Error handler (MUST be last, 4 params)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(3000, () => console.log('Server on :3000'))
```

## Router Structure

```typescript
// routes/users.ts
import { Router, Request, Response } from 'express'
const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const users = await UserService.findAll({ page: +page, limit: +limit, search: search as string })
    res.json({ data: users, page: +page, limit: +limit })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const user = await UserService.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

router.post('/', validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await UserService.create(req.body)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const user = await UserService.update(req.params.id, req.body)
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await UserService.delete(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
```

## Middleware Patterns

```typescript
// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = payload as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Validation middleware
import { z } from 'zod'
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(422).json({ errors: result.error.flatten().fieldErrors })
    }
    req.body = result.data
    next()
  }
}

// Rate limiting
import rateLimit from 'express-rate-limit'
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  message: { error: 'Too many requests' },
})

// Async wrapper (avoid try/catch in every handler)
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)
```

## File Upload

```typescript
import multer from 'multer'

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})

router.post('/avatar', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ url: `/uploads/${req.file.filename}` })
})
```

## Typed Express with TypeScript

```typescript
// types/express.d.ts
import { JwtPayload } from 'jsonwebtoken'
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string; role: string }
    }
  }
}
```

## Testing Express

```typescript
import request from 'supertest'
import app from '../app'

describe('POST /api/users', () => {
  it('creates user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'a@b.com', name: 'Alice' })
      .set('Authorization', `Bearer ${testToken}`)
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('a@b.com')
  })

  it('returns 422 for invalid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(422)
  })
})
```
