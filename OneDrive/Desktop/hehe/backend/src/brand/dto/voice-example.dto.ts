import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateVoiceExampleDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  performanceScore?: number;

  @IsOptional()
  @IsString()
  source?: string;
}
