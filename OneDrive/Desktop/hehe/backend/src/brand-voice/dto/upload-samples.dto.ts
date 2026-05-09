import { IsArray, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SamplePostDto {
  @IsString()
  caption!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsString()
  platform!: string;
}

export class UploadSamplesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SamplePostDto)
  @ArrayMinSize(5)
  posts!: SamplePostDto[];
}
