import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const VALID_PLATFORMS = ["instagram", "x", "linkedin", "facebook", "tiktok"] as const;
type ValidPlatform = (typeof VALID_PLATFORMS)[number];

interface CsvRow {
  title: string;
  caption: string;
  platforms: string;
  scheduledAt: string;
  imageUrl?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  posts?: Array<{ title: string; status: string }>;
}

@Injectable()
export class PostsImportService {
  private readonly logger = new Logger(PostsImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importFromCsv(
    teamId: string,
    fileBuffer: Buffer,
    dryRun?: boolean,
  ): Promise<ImportResult> {
    const rows = await this.parseCsv(fileBuffer);
    return this.processImport(teamId, rows, dryRun);
  }

  async importFromCsvStream(
    teamId: string,
    fileBuffer: Buffer,
    dryRun?: boolean,
  ): Promise<ImportResult> {
    const rows = await this.parseCsv(fileBuffer);
    return this.processImport(teamId, rows, dryRun);
  }

  private async processImport(
    teamId: string,
    rows: CsvRow[],
    dryRun?: boolean,
  ): Promise<ImportResult> {
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const validRows: Array<{ row: CsvRow; index: number }> = [];

    for (let i = 0; i < rows.length; i++) {
      const validationError = this.validateRow(rows[i], i + 2);
      if (validationError) {
        errors.push(validationError);
      } else {
        validRows.push({ row: rows[i], index: i + 2 });
      }
    }

    if (dryRun) {
      const posts = validRows.map(({ row }) => ({
        title: row.title,
        status: "scheduled",
      }));
      return {
        imported: validRows.length,
        failed: errors.length,
        errors,
        posts,
      };
    }

    let imported = 0;
    for (const { row } of validRows) {
      try {
        await this.upsertPost(teamId, row);
        imported++;
      } catch (error) {
        errors.push({
          row: 0,
          field: "import",
          message: `Failed to import "${row.title}": ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return {
      imported,
      failed: errors.length,
      errors,
    };
  }

  async parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    const content = this.decodeBuffer(buffer);
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException("CSV file is empty or has no data rows");
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const titleIndex = headers.indexOf("title");
    const captionIndex = headers.indexOf("caption");
    const platformsIndex = headers.indexOf("platforms");
    const scheduledAtIndex = headers.findIndex(
      (h) => h === "scheduledat" || h === "scheduled_at",
    );
    const imageUrlIndex = headers.findIndex(
      (h) => h === "imageurl" || h === "image_url",
    );

    if (
      titleIndex === -1 ||
      captionIndex === -1 ||
      platformsIndex === -1 ||
      scheduledAtIndex === -1
    ) {
      throw new BadRequestException(
        "CSV must contain columns: title, caption, platforms, scheduledAt",
      );
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length === 0) continue;

      rows.push({
        title: values[titleIndex]?.trim() || "",
        caption: values[captionIndex]?.trim() || "",
        platforms: values[platformsIndex]?.trim() || "",
        scheduledAt: values[scheduledAtIndex]?.trim() || "",
        imageUrl: imageUrlIndex !== -1 ? values[imageUrlIndex]?.trim() || undefined : undefined,
      });
    }

    return rows;
  }

  private decodeBuffer(buffer: Buffer): string {
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return buffer.toString("utf-8").slice(1);
    }
    return buffer.toString("utf-8");
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  validateRow(row: CsvRow, index: number): ValidationError | null {
    if (!row.title || row.title.length === 0) {
      return { row: index, field: "title", message: "Title is required" };
    }
    if (row.title.length > 200) {
      return {
        row: index,
        field: "title",
        message: "Title must be 200 characters or less",
      };
    }

    if (!row.caption || row.caption.length === 0) {
      return { row: index, field: "caption", message: "Caption is required" };
    }
    if (row.caption.length > 5000) {
      return {
        row: index,
        field: "caption",
        message: "Caption must be 5000 characters or less",
      };
    }

    if (!row.platforms || row.platforms.length === 0) {
      return { row: index, field: "platforms", message: "Platforms are required" };
    }
    const platformList = row.platforms.split("|").map((p) => p.trim().toLowerCase());
    const invalidPlatforms = platformList.filter(
      (p) => !VALID_PLATFORMS.includes(p as ValidPlatform),
    );
    if (invalidPlatforms.length > 0) {
      return {
        row: index,
        field: "platforms",
        message: `Invalid platforms: ${invalidPlatforms.join(", ")}. Valid values: ${VALID_PLATFORMS.join(", ")}`,
      };
    }

    if (!row.scheduledAt || row.scheduledAt.length === 0) {
      return { row: index, field: "scheduledAt", message: "scheduledAt is required" };
    }
    const parsedDate = new Date(row.scheduledAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return {
        row: index,
        field: "scheduledAt",
        message: "Invalid date format. Use ISO 8601 format",
      };
    }
    if (parsedDate <= new Date()) {
      return {
        row: index,
        field: "scheduledAt",
        message: "scheduledAt must be a future date",
      };
    }

    if (row.imageUrl && row.imageUrl.length > 0) {
      try {
        new URL(row.imageUrl);
      } catch {
        return {
          row: index,
          field: "imageUrl",
          message: "Invalid URL format",
        };
      }
    }

    return null;
  }

  async downloadImage(url: string): Promise<string | null> {
    if (!url || url.length === 0) {
      return null;
    }

    try {
      new URL(url);
      return url;
    } catch {
      this.logger.warn(`Invalid image URL: ${url}`);
      return null;
    }
  }

  async upsertPost(teamId: string, row: CsvRow): Promise<void> {
    const scheduledAt = new Date(row.scheduledAt);

    const existing = await this.prisma.post.findFirst({
      where: {
        teamId,
        title: row.title,
        scheduledAt,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    const platformList = row.platforms.split("|").map((p) => p.trim().toLowerCase());
    const imageUrl = await this.downloadImage(row.imageUrl || "");

    const post = await this.prisma.post.create({
      data: {
        teamId,
        title: row.title,
        content: row.caption,
        mediaUrls: imageUrl ? [imageUrl] : [],
        scheduledAt,
        status: "scheduled",
      },
    });

    await this.prisma.postPlatform.createMany({
      data: platformList.map((platform) => ({
        postId: post.id,
        platform,
        status: "scheduled",
      })),
    });
  }
}