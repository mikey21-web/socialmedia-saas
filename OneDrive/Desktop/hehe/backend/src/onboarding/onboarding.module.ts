import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { AutoOnboardController } from './auto-onboard.controller';
import { AutoOnboardService } from './auto-onboard.service';
import { AgencyModule } from '../agency/agency.module';
import { LlmModule } from '../agents/llm/llm.module';

@Module({
  imports: [AgencyModule, LlmModule],
  controllers: [OnboardingController, AutoOnboardController],
  providers: [OnboardingService, AutoOnboardService],
  exports: [AutoOnboardService],
})
export class OnboardingModule {}
