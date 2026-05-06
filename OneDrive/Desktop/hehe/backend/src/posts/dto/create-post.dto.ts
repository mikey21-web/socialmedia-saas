import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';

const VALID_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube', 'tiktok'] as const;

export class CreatePostDto {
  @IsString()
  @Length(1, 5000)
  content!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(VALID_PLATFORMS, { each: true })
  platforms!: string[];

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  postDelay?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurrencePattern?: string;

  @IsOptional()
  @IsISO8601()
  recurrenceEndAt?: string;

  @IsOptional()
  @IsString()
  postSetId?: string;
}
