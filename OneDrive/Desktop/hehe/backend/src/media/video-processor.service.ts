import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { promisify } from 'util';
import { exec as execCb } from 'child_process';

const exec = promisify(execCb);

export interface PlatformFormat {
  platform: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  width: number;
  height: number;
  maxDurationSec: number;
}

export const PLATFORM_FORMATS: PlatformFormat[] = [
  { platform: 'instagram_reels', aspectRatio: '9:16', width: 1080, height: 1920, maxDurationSec: 90 },
  { platform: 'tiktok', aspectRatio: '9:16', width: 1080, height: 1920, maxDurationSec: 180 },
  { platform: 'youtube_shorts', aspectRatio: '9:16', width: 1080, height: 1920, maxDurationSec: 60 },
  { platform: 'linkedin', aspectRatio: '16:9', width: 1920, height: 1080, maxDurationSec: 600 },
  { platform: 'x', aspectRatio: '1:1', width: 1080, height: 1080, maxDurationSec: 140 },
  { platform: 'facebook', aspectRatio: '4:5', width: 1080, height: 1350, maxDurationSec: 240 },
];

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
}

/**
 * Wraps FFmpeg for video transcoding into platform-specific formats.
 * Used by the video pipeline to convert one source upload into
 * 9:16, 16:9, 1:1, and 4:5 outputs with auto-cropping.
 */
@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);
  private ffmpegPath: string | null = null;
  private ffprobePath: string | null = null;

  constructor() {
    this.initializeFfmpegPaths();
  }

  private initializeFfmpegPaths(): void {
    try {
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg') as { path: string };
      this.ffmpegPath = ffmpegInstaller.path;
    } catch {
      this.ffmpegPath = process.env.FFMPEG_PATH ?? null;
    }
    try {
      const ffprobeInstaller = require('@ffprobe-installer/ffprobe') as { path: string };
      this.ffprobePath = ffprobeInstaller.path;
    } catch {
      this.ffprobePath = process.env.FFPROBE_PATH ?? null;
    }
  }

  isAvailable(): boolean {
    return this.ffmpegPath !== null && this.ffprobePath !== null;
  }

  async getMetadata(inputPath: string): Promise<VideoMetadata> {
    if (!this.ffprobePath) {
      throw new Error('ffprobe is not available');
    }

    const cmd = `"${this.ffprobePath}" -v error -show_entries stream=width,height,duration,bit_rate -of json "${inputPath}"`;
    const { stdout } = await exec(cmd);
    const data = JSON.parse(stdout) as {
      streams?: Array<{ width?: number; height?: number; duration?: string; bit_rate?: string }>;
    };
    const video = data.streams?.find((s) => s.width && s.height);
    if (!video) {
      throw new Error('Could not detect video stream');
    }

    return {
      duration: Number(video.duration ?? 0),
      width: Number(video.width ?? 0),
      height: Number(video.height ?? 0),
      bitrate: Number(video.bit_rate ?? 0),
    };
  }

  /**
   * Transcode a video to a target platform format.
   * Uses smart cropping (centered, with optional blurred background bars).
   */
  async transcodeForPlatform(
    inputPath: string,
    outputPath: string,
    format: PlatformFormat,
    options: { addCaptions?: boolean; captionsPath?: string } = {},
  ): Promise<{ outputPath: string; duration: number }> {
    if (!this.ffmpegPath) {
      throw new Error('FFmpeg is not available');
    }

    const meta = await this.getMetadata(inputPath);
    const sourceAspect = meta.width / meta.height;
    const targetAspect = format.width / format.height;

    let videoFilter: string;
    if (Math.abs(sourceAspect - targetAspect) < 0.01) {
      // Same aspect ratio, just scale
      videoFilter = `scale=${format.width}:${format.height}`;
    } else if (sourceAspect > targetAspect) {
      // Source is wider, scale to fit width and add blurred bars top/bottom
      videoFilter = [
        `[0:v]scale=${format.width}:-2,boxblur=20:5[bg]`,
        `[0:v]scale=${format.width}:-2[fg]`,
        `[bg]crop=${format.width}:${format.height}[bgcrop]`,
        `[bgcrop][fg]overlay=(W-w)/2:(H-h)/2`,
      ].join(';');
      videoFilter = `[0:v]split[a][b];[a]scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,boxblur=20:5,crop=${format.width}:${format.height}[bg];[b]scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
    } else {
      // Source is taller, scale to fit height
      videoFilter = `[0:v]split[a][b];[a]scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,boxblur=20:5,crop=${format.width}:${format.height}[bg];[b]scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
    }

    // Trim to max duration if needed
    const duration = Math.min(meta.duration, format.maxDurationSec);

    // Add subtitle filter if captions provided
    const captionFilter = options.addCaptions && options.captionsPath
      ? `,subtitles='${options.captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`
      : '';

    const cmd = [
      `"${this.ffmpegPath}"`,
      '-y',
      `-i "${inputPath}"`,
      `-filter_complex "${videoFilter}${captionFilter}"`,
      `-t ${duration}`,
      '-c:v libx264',
      '-preset fast',
      '-crf 23',
      '-c:a aac',
      '-b:a 128k',
      '-movflags +faststart',
      `"${outputPath}"`,
    ].join(' ');

    this.logger.log(`Transcoding for ${format.platform}: ${format.width}x${format.height}`);
    await exec(cmd, { maxBuffer: 1024 * 1024 * 100 });

    return { outputPath, duration };
  }

  /**
   * Generate captions/transcript using ffmpeg + (optionally) Whisper.
   * Returns SRT-formatted captions.
   */
  async generateCaptionsTrack(inputPath: string): Promise<string> {
    if (!this.ffmpegPath) {
      throw new Error('FFmpeg is not available');
    }

    // Extract audio to a wav file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-caps-'));
    const audioPath = path.join(tempDir, 'audio.wav');

    try {
      const cmd = `"${this.ffmpegPath}" -y -i "${inputPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;
      await exec(cmd);

      // Use Groq Whisper if available
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        const audioBuffer = await fs.readFile(audioPath);
        const formData = new FormData();
        formData.append('file', new Blob([audioBuffer]), 'audio.wav');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('response_format', 'srt');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}` },
          body: formData,
        });

        if (response.ok) {
          return await response.text();
        }
      }

      // No transcription provider available
      this.logger.warn('No transcription provider configured (set GROQ_API_KEY for Whisper)');
      return '';
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  /**
   * Generate a thumbnail image from a video at the given timestamp.
   */
  async generateThumbnail(inputPath: string, outputPath: string, atSec: number = 1): Promise<string> {
    if (!this.ffmpegPath) {
      throw new Error('FFmpeg is not available');
    }

    const cmd = `"${this.ffmpegPath}" -y -ss ${atSec} -i "${inputPath}" -frames:v 1 -q:v 2 "${outputPath}"`;
    await exec(cmd);
    return outputPath;
  }

  /**
   * Cleanup temporary files older than 1 hour.
   */
  async cleanupTempFiles(): Promise<void> {
    const tempDir = os.tmpdir();
    const entries = await fs.readdir(tempDir).catch(() => []);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const entry of entries) {
      if (!entry.startsWith('video-')) continue;
      try {
        const fullPath = path.join(tempDir, entry);
        const stat = await fs.stat(fullPath);
        if (stat.mtimeMs < oneHourAgo) {
          await fs.rm(fullPath, { recursive: true, force: true });
        }
      } catch {
        // ignore
      }
    }
  }
}
