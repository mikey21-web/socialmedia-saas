import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CritiqueModule } from './critique/critique.module';
import { MultilingualModule } from './multilingual/multilingual.module';
import { DiscoveryController } from './discovery/discovery.controller';

@Module({
  imports: [CritiqueModule, MultilingualModule],
  controllers: [AiController, DiscoveryController],
  providers: [AiService],
  exports: [CritiqueModule, MultilingualModule],
})
export class AiModule {}
