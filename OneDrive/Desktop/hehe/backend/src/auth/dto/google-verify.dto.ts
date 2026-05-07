import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleVerifyDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
