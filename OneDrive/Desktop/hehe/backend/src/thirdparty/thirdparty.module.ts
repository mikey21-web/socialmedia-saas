import { Global, Module } from '@nestjs/common';
import { HeygenProvider } from './heygen/heygen.provider';
import { ThirdPartyManager } from './thirdparty.manager';
import { ThirdPartyService } from './thirdparty.service';
import { ThirdPartyController } from './thirdparty.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ThirdPartyController],
  providers: [HeygenProvider, ThirdPartyManager, ThirdPartyService],
  exports: [ThirdPartyManager, ThirdPartyService],
})
export class ThirdPartyModule {}
