# Media Upload + AI Image Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build end-to-end media flow: upload images/videos to local disk, generate AI images via Replicate, wire both into the post creation modal so `mediaUrls` actually reach the database.

**Architecture:** NestJS `MediaModule` handles multipart upload (multer) and Replicate inference. Static files served directly by NestJS. Frontend `media.ts` utility uploads files before post creation and calls generate endpoint. `PostModal` gains an "AI Generate" tab alongside the existing drag-drop upload.

**Tech Stack:** `multer` (bundled with `@nestjs/platform-express`), `replicate` npm package, NestJS `ServeStaticModule`, `@nestjs/platform-express` `FileInterceptor`, Zod (frontend validation already in use), React hooks.

---

## File Map

### Backend (create)
- `backend/src/media/media.module.ts` — NestJS module wiring
- `backend/src/media/media.controller.ts` — `POST /media/upload`, `POST /media/generate`
- `backend/src/media/media.service.ts` — file storage logic + Replicate call
- `backend/src/media/dto/generate-image.dto.ts` — DTO for generate body

### Backend (modify)
- `backend/src/app.module.ts` — import `MediaModule` + `ServeStaticModule`
- `backend/package.json` — add `replicate` and `@nestjs/serve-static`

### Frontend (create)
- `frontend/lib/media.ts` — `uploadFile(file)` and `generateImage(prompt)` utilities

### Frontend (modify)
- `frontend/components/post-modal.tsx` — wire upload + AI generate tab
- `frontend/store/posts.ts` — pass `mediaUrls` in `createPost` payload (already accepted by backend DTO, just not sent)

---

## Task 1: Install backend packages

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install replicate and serve-static**

```bash
cd backend && npm install replicate @nestjs/serve-static
```

Expected: `added N packages` — no errors.

- [ ] **Step 2: Verify types available**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: same errors as before (zero new ones).

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add replicate and serve-static packages"
```

---

## Task 2: Create `generate-image.dto.ts`

**Files:**
- Create: `backend/src/media/dto/generate-image.dto.ts`

- [ ] **Step 1: Create DTO**

```typescript
// backend/src/media/dto/generate-image.dto.ts
import { IsString, Length } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  @Length(3, 1000)
  prompt!: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/media/dto/generate-image.dto.ts
git commit -m "feat(media): add GenerateImageDto"
```

---

## Task 3: Create `MediaService`

**Files:**
- Create: `backend/src/media/media.service.ts`

- [ ] **Step 1: Write failing unit test**

Create `backend/src/media/media.service.spec.ts`:

```typescript
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    service = new MediaService();
  });

  describe('getFileUrl', () => {
    it('returns a /uploads/ prefixed URL for a filename', () => {
      const result = service.getFileUrl('abc123.jpg');
      expect(result).toBe('/uploads/abc123.jpg');
    });
  });

  describe('validateMimeType', () => {
    it('accepts image/jpeg', () => {
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
    });

    it('accepts video/mp4', () => {
      expect(() => service.validateMimeType('video/mp4')).not.toThrow();
    });

    it('rejects text/plain', () => {
      expect(() => service.validateMimeType('text/plain')).toThrow('Unsupported file type');
    });
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd backend && npx jest media.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module './media.service'`

- [ ] **Step 3: Implement MediaService**

```typescript
// backend/src/media/media.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import Replicate from 'replicate';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  validateMimeType(mimeType: string): void {
    const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
      mimeType.startsWith(prefix),
    );
    if (!allowed) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new BadRequestException('REPLICATE_API_TOKEN not configured');
    }

    const replicate = new Replicate({ auth: token });

    this.logger.log(`Generating image for prompt: "${prompt.slice(0, 60)}..."`);

    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      { input: { prompt, num_outputs: 1 } },
    ) as string[];

    if (!output || !output[0]) {
      throw new BadRequestException('Replicate returned no output');
    }

    return output[0];
  }
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
cd backend && npx jest media.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: `PASS src/media/media.service.spec.ts` with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/media/media.service.ts backend/src/media/media.service.spec.ts
git commit -m "feat(media): implement MediaService with file URL helper and Replicate image gen"
```

---

## Task 4: Create `MediaController`

**Files:**
- Create: `backend/src/media/media.controller.ts`

- [ ] **Step 1: Write failing controller test**

Create `backend/src/media/media.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { BadRequestException } from '@nestjs/common';

const mockService = {
  validateMimeType: jest.fn(),
  getFileUrl: jest.fn().mockReturnValue('/uploads/test.jpg'),
  generateImage: jest.fn().mockResolvedValue('https://replicate.delivery/test.jpg'),
};

const mockUser = { userId: 'u1', email: 'a@b.com', team_id: 't1' };

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockService }],
    }).compile();
    controller = module.get(MediaController);
  });

  describe('upload', () => {
    it('returns url for valid file', async () => {
      mockService.validateMimeType.mockReturnValueOnce(undefined);
      const file = { originalname: 'img.jpg', mimetype: 'image/jpeg', filename: 'abc.jpg' } as Express.Multer.File;
      const result = await controller.upload({ user: mockUser } as any, file);
      expect(result).toEqual({ url: '/uploads/test.jpg' });
    });

    it('throws when no file provided', async () => {
      await expect(
        controller.upload({ user: mockUser } as any, undefined as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateImage', () => {
    it('returns url from Replicate', async () => {
      const result = await controller.generateImage(
        { user: mockUser } as any,
        { prompt: 'a red fox' },
      );
      expect(result).toEqual({ url: 'https://replicate.delivery/test.jpg' });
    });
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd backend && npx jest media.controller.spec.ts --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module './media.controller'`

- [ ] **Step 3: Implement MediaController**

```typescript
// backend/src/media/media.controller.ts
import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { MediaService } from './media.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { AuthenticatedRequestUser } from '../common/interfaces/authenticated-request-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = crypto.randomBytes(16).toString('hex');
          cb(null, `${name}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async upload(
    @Req() req: { user: AuthenticatedRequestUser },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    this.mediaService.validateMimeType(file.mimetype);
    const url = this.mediaService.getFileUrl(file.filename);
    return { url };
  }

  @Post('generate')
  async generateImage(
    @Req() req: { user: AuthenticatedRequestUser },
    @Body() dto: GenerateImageDto,
  ): Promise<{ url: string }> {
    const url = await this.mediaService.generateImage(dto.prompt);
    return { url };
  }
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
cd backend && npx jest media.controller.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: `PASS src/media/media.controller.spec.ts` with 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/media/media.controller.ts backend/src/media/media.controller.spec.ts
git commit -m "feat(media): implement MediaController with upload and AI generate endpoints"
```

---

## Task 5: Create `MediaModule` and wire into `AppModule`

**Files:**
- Create: `backend/src/media/media.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create MediaModule**

```typescript
// backend/src/media/media.module.ts
import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
```

- [ ] **Step 2: Update AppModule**

In `backend/src/app.module.ts`, add imports at top:

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { MediaModule } from './media/media.module';
```

Add to the `imports` array (inside `@Module`):

```typescript
ServeStaticModule.forRoot({
  rootPath: path.join(process.cwd(), 'uploads'),
  serveRoot: '/uploads',
  serveStaticOptions: { index: false },
}),
MediaModule,
```

Full updated `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { MediaModule } from './media/media.module';
import { PlatformsModule } from './platforms/platforms.module';
import { PublishingModule } from './publishing/publishing.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TeamsModule } from './teams/teams.module';
import { TemporalModule } from './temporal/temporal.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    TemporalModule,
    AuthModule,
    MediaModule,
    PostsModule,
    PublishingModule,
    PlatformsModule,
    AnalyticsModule,
    WebhooksModule,
    SubscriptionsModule,
    TeamsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
```

- [ ] **Step 3: TypeScript check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep -v node_modules | head -30
```

Expected: zero new errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/media/media.module.ts backend/src/app.module.ts
git commit -m "feat(media): wire MediaModule and ServeStaticModule into AppModule"
```

---

## Task 6: Manual smoke test of upload endpoint

- [ ] **Step 1: Start backend**

```bash
cd backend && npm run start:dev
```

Wait for `Application is listening on port 3001`.

- [ ] **Step 2: Get a JWT** (replace with a real token from your auth flow or test user)

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo $TOKEN
```

- [ ] **Step 3: Upload a test image**

```bash
curl -s -X POST http://localhost:3001/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/any/image.jpg" | python3 -m json.tool
```

Expected:
```json
{ "url": "/uploads/<hex>.jpg" }
```

- [ ] **Step 4: Verify file exists**

```bash
ls backend/uploads/
```

Expected: one `.jpg` file with hex name.

- [ ] **Step 5: Verify static serving**

```bash
curl -I "http://localhost:3001/uploads/<filename-from-step3>.jpg"
```

Expected: `HTTP/1.1 200 OK` with `Content-Type: image/jpeg`.

---

## Task 7: Frontend `media.ts` utility

**Files:**
- Create: `frontend/lib/media.ts`

- [ ] **Step 1: Create utility**

```typescript
// frontend/lib/media.ts
import { api } from './api';

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const response = await api.post<{ url: string }>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { url } = response.data;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  // If url is relative (/uploads/...), make it absolute for img src
  return url.startsWith('http') ? url : `${base}${url}`;
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await api.post<{ url: string }>('/media/generate', { prompt });
  return response.data.url;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/lib/media.ts
git commit -m "feat(media): add uploadFile and generateImage frontend utilities"
```

---

## Task 8: Update `PostModal` — wire upload + AI generate tab

**Files:**
- Modify: `frontend/components/post-modal.tsx`

This is a full replacement of the component. The existing file is at `frontend/components/post-modal.tsx`.

- [ ] **Step 1: Replace post-modal.tsx with wired version**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  AlertCircle,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PLATFORM_DOTS,
  PLATFORM_LABELS,
  type Platform,
} from "@/components/platform-badge";
import { usePostsStore } from "@/store/posts";
import { uploadFile, generateImage } from "@/lib/media";

const ALL_PLATFORMS: Platform[] = [
  "twitter",
  "instagram",
  "linkedin",
  "facebook",
];

const schema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Max 280 characters"),
  scheduledAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type MediaTab = "upload" | "generate";

interface Props {
  trigger?: React.ReactNode;
  defaultDate?: string;
  onSuccess?: () => void;
}

export function PostModal({ trigger, defaultDate, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Platform[]>(["twitter"]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [media, setMedia] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [mediaTab, setMediaTab] = useState<MediaTab>("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const createPost = usePostsStore((s) => s.createPost);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { scheduledAt: defaultDate ?? "" },
  });

  const content = watch("content") ?? "";
  const charCount = content.length;

  function togglePlatform(p: Platform) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setMedia((prev) => [...prev, ...files].slice(0, 4));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.currentTarget.files || []);
    setMedia((prev) => [...prev, ...files].slice(0, 4));
    e.currentTarget.value = "";
  }

  function removeLocalFile(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  function removeMediaUrl(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerateAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const url = await generateImage(aiPrompt.trim());
      setMediaUrls((prev) => [...prev, url].slice(0, 4));
      setAiPrompt("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);
    let allUrls = [...mediaUrls];

    if (media.length > 0) {
      setUploadingFiles(true);
      try {
        const uploaded = await Promise.all(media.map(uploadFile));
        allUrls = [...allUrls, ...uploaded];
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "File upload failed");
        setUploadingFiles(false);
        return;
      }
      setUploadingFiles(false);
    }

    try {
      await createPost(
        values.content,
        selected,
        values.scheduledAt || undefined,
        allUrls.length > 0 ? allUrls : undefined
      );
      reset();
      setSelected(["twitter"]);
      setMedia([]);
      setMediaUrls([]);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create post";
      setApiError(message);
    }
  }

  const defaultTrigger = (
    <Button
      size="sm"
      className="gap-1.5 h-11 md:h-7 w-full sm:w-auto"
      onClick={() => setOpen(true)}
    >
      <Plus className="size-3.5" />
      Schedule Post
    </Button>
  );

  const totalMedia = media.length + mediaUrls.length;
  const isUploading = uploadingFiles || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      ) : (
        defaultTrigger
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {apiError && (
            <div className="flex gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          )}

          {/* Platform selector */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    selected.includes(p)
                      ? "border-ring bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", PLATFORM_DOTS[p])}
                  />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
            {selected.length === 0 && (
              <p className="text-xs text-destructive">
                Select at least one platform
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-content">Content</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  charCount > 260
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {charCount}/280
              </span>
            </div>
            <Textarea
              id="modal-content"
              placeholder="What do you want to share?"
              className="min-h-[100px] resize-none"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Media section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media {totalMedia > 0 && `(${totalMedia}/4)`}</Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMediaTab("upload")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors",
                    mediaTab === "upload"
                      ? "bg-accent border-ring text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab("generate")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md border transition-colors inline-flex items-center gap-1",
                    mediaTab === "generate"
                      ? "bg-accent border-ring text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <Sparkles className="size-3" />
                  AI Generate
                </button>
              </div>
            </div>

            {mediaTab === "upload" && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                  dragActive
                    ? "border-ring bg-accent/50"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={totalMedia >= 4}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {totalMedia >= 4
                        ? "Max 4 files reached"
                        : "Drag files here or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images and videos up to 10 MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mediaTab === "generate" && (
              <div className="space-y-2">
                {aiError && (
                  <p className="text-xs text-destructive">{aiError}</p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the image you want..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleGenerateAI();
                      }
                    }}
                    disabled={aiLoading || totalMedia >= 4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleGenerateAI()}
                    disabled={aiLoading || !aiPrompt.trim() || totalMedia >= 4}
                    className="shrink-0"
                  >
                    {aiLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Powered by FLUX Schnell via Replicate
                </p>
              </div>
            )}

            {/* Media previews — both local files and AI-generated URLs */}
            {(media.length > 0 || mediaUrls.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {media.map((file, i) => (
                  <div
                    key={`file-${i}`}
                    className="relative flex items-center gap-2 p-2 rounded-lg bg-muted border border-border text-xs"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeLocalFile(i)}
                      className="shrink-0 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {mediaUrls.map((url, i) => (
                  <div
                    key={`url-${i}`}
                    className="relative rounded-lg overflow-hidden border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Generated ${i + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeMediaUrl(i)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 hover:bg-destructive/80"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule datetime */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-scheduled">Schedule for (optional)</Label>
            <Input
              id="modal-scheduled"
              type="datetime-local"
              {...register("scheduledAt")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || selected.length === 0}
            >
              {uploadingFiles ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading…
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Schedule"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/post-modal.tsx
git commit -m "feat(media): wire file upload and AI image generation into PostModal"
```

---

## Task 9: Update `posts.ts` store to pass `mediaUrls`

**Files:**
- Modify: `frontend/store/posts.ts`

Current `createPost` signature: `(content, platforms, scheduledAt?)` — needs `mediaUrls?` param.

- [ ] **Step 1: Update store**

Replace the `createPost` function signature and body in `frontend/store/posts.ts`:

In the `PostsState` interface, change:
```typescript
createPost: (content: string, platforms: Platform[], scheduledAt?: string) => Promise<void>;
```
to:
```typescript
createPost: (content: string, platforms: Platform[], scheduledAt?: string, mediaUrls?: string[]) => Promise<void>;
```

In the `create` call, change the `createPost` implementation:
```typescript
createPost: async (content: string, platforms: Platform[], scheduledAt?: string, mediaUrls?: string[]) => {
```

And update the `api.post` call body from:
```typescript
await api.post("/posts", {
  content,
  platforms,
  scheduledAt: scheduledAt || undefined,
});
```
to:
```typescript
await api.post("/posts", {
  content,
  platforms,
  scheduledAt: scheduledAt || undefined,
  ...(mediaUrls && mediaUrls.length > 0 ? { mediaUrls } : {}),
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/store/posts.ts
git commit -m "feat(media): pass mediaUrls through store createPost to backend"
```

---

## Task 10: Add `.env` variable for Replicate

**Files:**
- Modify: `backend/.env` (add key, never commit)

- [ ] **Step 1: Add to .env**

Open `backend/.env` and add:

```
REPLICATE_API_TOKEN=r8_your_token_here
```

Get token from https://replicate.com/account/api-tokens (free account, 100 free predictions/month).

- [ ] **Step 2: Verify .env is gitignored**

```bash
cat backend/.gitignore | grep .env
```

Expected: `.env` in output. If not, add it:
```bash
echo ".env" >> backend/.gitignore
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Start both servers**

Terminal 1:
```bash
cd backend && npm run start:dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Open browser**

Navigate to `http://localhost:3000`. Log in. Click "Schedule Post".

- [ ] **Step 3: Test file upload path**

1. Drag an image into the upload zone
2. Verify file appears in media list
3. Fill in post content, select platform, click Schedule
4. Open Network tab — confirm `POST /media/upload` returns `{ url: "/uploads/..." }`
5. Confirm `POST /posts` body contains `mediaUrls: ["http://localhost:3001/uploads/..."]`
6. Check `backend/uploads/` folder — file should be there

- [ ] **Step 4: Test AI generate path**

1. Click "AI Generate" tab
2. Type a prompt: `"A vibrant sunset over mountains"`
3. Click the sparkle button
4. Verify generated image thumbnail appears
5. Fill content + platform, click Schedule
6. Confirm `POST /posts` body contains the Replicate URL in `mediaUrls`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete media upload and AI image generation flow"
```

---

## Summary

| Endpoint | Method | Auth | What |
|----------|--------|------|------|
| `/media/upload` | POST | JWT | Multipart file → local disk → returns `/uploads/<hex>.ext` |
| `/media/generate` | POST | JWT | `{ prompt }` → Replicate FLUX → returns remote URL |
| `/uploads/<file>` | GET | None | Static file serving |

**Flow:** User picks files or generates AI image → on Schedule click, files upload first → all URLs collected → `POST /posts` with `mediaUrls[]` → Temporal publishes with media attached.
