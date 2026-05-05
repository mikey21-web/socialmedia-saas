import { NativeConnection, Worker } from '@temporalio/worker';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsService } from '../platforms/platforms.service';
import { EmailService } from '../email/email.service';
import { createPublishingActivities } from '../publishing/activities';
import { createAnalyticsActivities } from '../analytics/activities';

async function runWorker() {
  process.env.DISABLE_NEST_SCHEDULER = 'true';
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const platformsService = app.get(PlatformsService);
  const emailService = app.get(EmailService);

  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_SERVER_URL ?? 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'posts-queue',
    workflowsPath: require.resolve('../workflows'),
    activities: {
      ...createPublishingActivities(prisma, platformsService, emailService),
      ...createAnalyticsActivities(prisma, platformsService),
    },
  });

  await worker.run();
  await app.close();
}

runWorker().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Temporal worker crashed', error);
  process.exit(1);
});
