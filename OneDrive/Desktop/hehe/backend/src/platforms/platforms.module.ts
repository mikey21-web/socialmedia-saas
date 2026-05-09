import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CryptoService } from '../common/crypto.service';
import { PlanLimitGuard } from '../common/guards/plan-limit.guard';
import { RedisProvider } from '../common/redis.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { PlatformCallbacksController, PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [PlatformsController, PlatformCallbacksController, OauthController],
  providers: [PlatformsService, OauthService, RedisProvider, CryptoService, PlanLimitGuard],
  exports: [PlatformsService, OauthService, CryptoService],
})
export class PlatformsModule {}
