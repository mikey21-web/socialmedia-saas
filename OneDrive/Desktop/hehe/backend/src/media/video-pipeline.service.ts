import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../agents/llm/llm.service';
import { R2StorageService } from './r2-storage.service';
import { VideoProcessorService, PLATFORM_FORMATS, PlatformFormat } from './video-processor.service';

export interface UploadVideoDto {
  title: string;
  sourceVideoUrl: string;
  duration?: number;
  targetPlatforms?: string[];
}

export interface VideoClip {
  startTime: number;
  endTime: number;
  platform: string;
  aspectRatio: string;
  url?: string;
}

@Injectable()
export class VideoPipelineService {
  private readonly logger = new Logger(VideoPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly processor: VideoProcessorService,
    private readonly r2Storage: R2StorageService,
  ) {}

  async createProject(teamId: string, dto: UploadVideoDto) {
    const project = await this.prisma.videoProject.create({
      data: {
        teamId,
        title: dto.title,
        sourceVideoUrl: dto.sourceVideoUrl,
        sourceVideoDuration: dto.duration,
        status: 'uploaded',
      },
    });

    this.processVideo(project.id, teamId, dto.targetPlatforms).catch((err) => {
      this.logger.error(`Video processing failed for ${project.id}`, err);
    });

    return project;
  }

  async getProject(teamId: string, projectId: string) {
    const project = await this.prisma.videoProject.findFirst({
      where: { id: projectId, teamId },
    });
    if (!project) throw new NotFoundException('Video project not found');
    return project;
  }

  async listProjects(teamId: string) {
    return this.prisma.videoProject.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async suggestHooks(teamId: string, projectId: string) {
    const project = await this.getProject(teamId, projectId);

    const brandProfile = await this.prisma.brandProfile.findUnique({
      where: { teamId },
    });

    const prompt = `Generate 5 engaging hook suggestions for a short-form video.

Video title: "${project.title}"
Brand: ${brandProfile?.brandName ?? 'Unknown'} (${brandProfile?.industry ?? 'general'})
Voice: ${brandProfile?.voiceTone ?? 'professional'}

These hooks will be text overlays in the first 3 seconds of the video.
They should stop the scroll and make people watch.

Return JSON: { "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"] }`;

    const result = await this.llm.completeJson<{ hooks: string[] }>(prompt, { maxTokens: 500 });

    await this.prisma.videoProject.update({
      where: { id: projectId },
      data: { suggestedHooks: result.hooks },
    });

    return result.hooks;
  }

  async getOutputFormats() {
    return PLATFORM_FORMATS;
  }

  async suggestMusicTracks(teamId: string, projectId: string) {
    const project = await this.getProject(teamId, projectId);

    const tracks = await this.prisma.musicTrack.findMany({
      where: {
        duration: project.sourceVideoDuration
          ? { lte: project.sourceVideoDuration + 10 }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return tracks;
  }

  /**
   * Processes the source video into all platform-specific formats.
   * Downloads → transcodes → uploads each output to R2/S3 → updates project.
   */
  private async processVideo(projectId: string, teamId: string, targetPlatforms?: string[]) {
    await this.prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'processing' },
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-'));

    try {
      const project = await this.prisma.videoProject.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('Project disappeared');

      // 1. Download source video to temp file
      const sourcePath = path.join(tempDir, 'source.mp4');
      await this.downloadVideo(project.sourceVideoUrl, sourcePath);

      // 2. Get metadata
      let metadata: Awaited<ReturnType<VideoProcessorService['getMetadata']>> | null = null;
      if (this.processor.isAvailable()) {
        try {
          metadata = await this.processor.getMetadata(sourcePath);
          await this.prisma.videoProject.update({
            where: { id: projectId },
            data: { sourceVideoDuration: metadata.duration },
          });
        } catch (err) {
          this.logger.warn(`Metadata fetch failed: ${(err as Error)?.message}`);
        }
      }

      // 3. Generate hook suggestions in parallel with transcoding
      const hooksPromise = this.suggestHooks(teamId, projectId).catch(() => undefined);

      // 4. Pick formats to render
      const formatsToProcess = targetPlatforms?.length
        ? PLATFORM_FORMATS.filter((f) => targetPlatforms.includes(f.platform))
        : PLATFORM_FORMATS.slice(0, 3); // default: top 3

      // 5. Transcode + upload each output
      const outputFormats: Array<{ platform: string; aspectRatio: string; url: string }> = [];
      const clips: VideoClip[] = [];

      if (this.processor.isAvailable()) {
        for (const format of formatsToProcess) {
          try {
            const outputPath = path.join(tempDir, `${format.platform}.mp4`);
            await this.processor.transcodeForPlatform(sourcePath, outputPath, format);
            const buffer = await fs.readFile(outputPath);
            const key = `videos/${projectId}/${format.platform}.mp4`;
            const url = await this.r2Storage.upload(key, buffer, 'video/mp4');
            outputFormats.push({ platform: format.platform, aspectRatio: format.aspectRatio, url });
            clips.push({
              startTime: 0,
              endTime: Math.min(metadata?.duration ?? format.maxDurationSec, format.maxDurationSec),
              platform: format.platform,
              aspectRatio: format.aspectRatio,
              url,
            });
          } catch (err) {
            this.logger.warn(`Transcoding ${format.platform} failed: ${(err as Error)?.message}`);
          }
        }
      } else {
        this.logger.warn('FFmpeg not available, recording metadata only');
        // Record format placeholders so the UI can show what would be done
        for (const format of formatsToProcess) {
          outputFormats.push({ platform: format.platform, aspectRatio: format.aspectRatio, url: '' });
        }
      }

      // 6. Generate thumbnail and captions
      let thumbnailUrl: string | null = null;
      let captionsRaw: string | null = null;

      if (this.processor.isAvailable()) {
        try {
          const thumbPath = path.join(tempDir, 'thumb.jpg');
          await this.processor.generateThumbnail(sourcePath, thumbPath, 1);
          const thumbBuffer = await fs.readFile(thumbPath);
          thumbnailUrl = await this.r2Storage.upload(
            `videos/${projectId}/thumb.jpg`,
            thumbBuffer,
            'image/jpeg',
          );
        } catch (err) {
          this.logger.warn(`Thumbnail generation failed: ${(err as Error)?.message}`);
        }

        try {
          captionsRaw = await this.processor.generateCaptionsTrack(sourcePath);
        } catch (err) {
          this.logger.warn(`Caption generation failed: ${(err as Error)?.message}`);
        }
      }

      await hooksPromise;

      // 7. Save outputs
      await this.prisma.videoProject.update({
        where: { id: projectId },
        data: {
          status: 'clips_ready',
          outputFormats: outputFormats as any,
          clips: clips as any,
          captions: captionsRaw ? this.parseCaptions(captionsRaw) : ([] as any),
          thumbnailUrl: thumbnailUrl ?? undefined,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      await this.prisma.videoProject.update({
        where: { id: projectId },
        data: { status: 'failed', processingError: message },
      });
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async downloadVideo(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Parse SRT captions into structured array.
   */
  private parseCaptions(srt: string): Array<{ startTime: number; endTime: number; text: string }> {
    const captions: Array<{ startTime: number; endTime: number; text: string }> = [];
    const blocks = srt.split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.split('\n').filter(Boolean);
      if (lines.length < 3) continue;

      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
      if (!timeMatch) continue;

      const startTime = this.timeToSec(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
      const endTime = this.timeToSec(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
      const text = lines.slice(2).join(' ');

      captions.push({ startTime, endTime, text });
    }

    return captions;
  }

  private timeToSec(h: string, m: string, s: string, ms: string): number {
    return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
  }
}
