import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOauthController } from './google-oauth.controller';
import { GoogleOauthStrategy } from './google-oauth.strategy';
import { JwtAuthGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
      signOptions: { expiresIn: (process.env.JWT_EXPIRY ?? '7d') as StringValue },
    }),
    PrismaModule,
    EmailModule,
  ],
  controllers: [AuthController, GoogleOauthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, GoogleOauthStrategy],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
