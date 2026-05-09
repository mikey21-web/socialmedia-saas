import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  name!: string;

  @IsString()
  primaryColor!: string;

  @IsString()
  fontPrimary!: string;

  @IsString()
  @IsOptional()
  fontSecondary?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
