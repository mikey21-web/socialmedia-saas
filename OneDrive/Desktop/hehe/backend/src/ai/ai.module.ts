import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CritiqueModule } from './critique/critique.module';
import { DiscoveryController } from './discovery/discovery.controller';

@Module({
  imports: [CritiqueModule],
  controllers: [AiController, DiscoveryController],
  providers: [AiService],
  exports: [CritiqueModule],
})
export class AiModule {}
