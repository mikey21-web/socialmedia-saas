import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCompetitorDto {
  @IsString()
  name!: string;

  @IsOptional()
  handles?: Record<string, string>;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
