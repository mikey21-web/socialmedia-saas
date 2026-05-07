import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 2000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
