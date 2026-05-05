import { IsArray, IsISO8601, IsIn, IsOptional, IsString, IsUrl, Length } from 'class-validator';

const VALID_STATUSES = ['draft', 'scheduled', 'published'] as const;

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  content?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsIn(VALID_STATUSES)
  status?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];
}
