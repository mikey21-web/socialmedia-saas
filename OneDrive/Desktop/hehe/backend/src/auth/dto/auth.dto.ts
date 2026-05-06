import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
