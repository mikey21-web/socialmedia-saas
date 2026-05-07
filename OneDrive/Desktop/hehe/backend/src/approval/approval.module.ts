import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalEmailService } from './email.service';

@Module({
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalEmailService],
  exports: [ApprovalService, ApprovalEmailService],
})
export class ApprovalModule {}
