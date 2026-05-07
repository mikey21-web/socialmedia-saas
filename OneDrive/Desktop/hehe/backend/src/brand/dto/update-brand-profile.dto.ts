import { IsString, IsOptional, IsArray, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class UpdateBrandProfileDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  voiceTone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  voiceTraits?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  formalityLevel?: number;

  @IsOptional()
  @IsString()
  audienceAge?: string;

  @IsOptional()
  @IsString()
  audienceGender?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceLocation?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceInterests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audiencePainPoints?: string[];

  @IsOptional()
  @IsString()
  primaryGoal?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryGoals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  postsPerWeek?: Record<string, number>;

  @IsOptional()
  contentMix?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alwaysWords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  neverWords?: string[];

  @IsOptional()
  @IsString()
  emojiUsage?: string;

  @IsOptional()
  @IsString()
  hashtagStyle?: string;

  @IsOptional()
  @IsBoolean()
  autonomousMode?: boolean;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;
}
