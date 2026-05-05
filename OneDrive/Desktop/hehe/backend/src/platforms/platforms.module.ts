import { Module } from '@nestjs/common';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';

@Module({
  controllers: [PlatformsController, OauthController],
  providers: [PlatformsService, OauthService],
  exports: [PlatformsService, OauthService],
})
export class PlatformsModule {}
