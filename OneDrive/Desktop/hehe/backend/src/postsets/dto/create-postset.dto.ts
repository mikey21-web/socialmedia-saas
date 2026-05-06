import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePostsetDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
