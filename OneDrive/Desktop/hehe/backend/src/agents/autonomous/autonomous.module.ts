import { Module } from '@nestjs/common';
import { AutonomousService } from './autonomous.service';
import { ContentAgentModule } from '../content/content.module';
import { TrendAgentModule } from '../trend/trend.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, ContentAgentModule, TrendAgentModule, EmailModule, NotificationsModule],
  providers: [AutonomousService],
  exports: [AutonomousService],
})
export class AutonomousModule {}
