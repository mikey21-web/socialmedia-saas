import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

const VALID_PLATFORMS = ['twitter', 'instagram', 'linkedin', 'facebook'] as const;

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
}
