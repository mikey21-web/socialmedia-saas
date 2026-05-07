import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  await prisma.$executeRawUnsafe(`ALTER TABLE "PostPublishLog" ADD COLUMN IF NOT EXISTS "attemptNumber" INTEGER NOT NULL DEFAULT 1`);
  console.log('Column added.');
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PostPublishLog_status_idx" ON "PostPublishLog"("status")`);
  console.log('Index added.');
  await prisma.$disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
