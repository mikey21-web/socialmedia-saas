import { Module } from '@nestjs/common';
import { RedisProvider } from '../common/redis.provider';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  controllers: [PlatformsController, OauthController],
  providers: [PlatformsService, OauthService, RedisProvider],
  exports: [PlatformsService, OauthService],
})
export class PlatformsModule {}
