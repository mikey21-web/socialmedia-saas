import { IsString, Length } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  @Length(3, 1000)
  prompt!: string;
}
