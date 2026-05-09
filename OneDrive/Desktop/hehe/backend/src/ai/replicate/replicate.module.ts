import { Module } from '@nestjs/common';
import { ReplicateProvider } from './replicate.provider';

@Module({
  providers: [ReplicateProvider],
  exports: [ReplicateProvider],
})
export class ReplicateModule {}
