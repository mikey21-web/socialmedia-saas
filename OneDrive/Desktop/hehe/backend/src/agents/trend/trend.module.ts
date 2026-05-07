import { Module } from '@nestjs/common';
import { BrandModule } from '../../brand/brand.module';
import { ContentAgentModule } from '../content/content.module';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';

@Module({
  imports: [BrandModule, ContentAgentModule],
  controllers: [TrendController],
  providers: [TrendService],
  exports: [TrendService],
})
export class TrendAgentModule {}
