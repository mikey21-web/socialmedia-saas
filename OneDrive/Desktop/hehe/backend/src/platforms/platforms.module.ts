import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RedisProvider } from '../common/redis.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { PlatformCallbacksController, PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [PlatformsController, PlatformCallbacksController, OauthController],
  providers: [PlatformsService, OauthService, RedisProvider],
  exports: [PlatformsService, OauthService],
})
export class PlatformsModule {}
