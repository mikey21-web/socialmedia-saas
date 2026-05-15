import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AutopilotController } from './autopilot.controller';
import { AutopilotService } from './autopilot.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController, AutopilotController],
  providers: [DashboardService, AutopilotService],
  exports: [DashboardService],
})
export class DashboardModule {}
