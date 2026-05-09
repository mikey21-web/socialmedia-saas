import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService wraps PrismaClient and provides NestJS lifecycle integration.
 *
 * NOTE: When new models are added to schema.prisma, run `npm run prisma:generate`
 * to regenerate the typed client. Until that is done, access new models via
 * `(this.prisma as any).modelName` or the `db` escape-hatch getter below.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Escape-hatch accessor for Prisma model delegates that exist in schema.prisma
   * but are not yet reflected in the generated client types (i.e., `prisma generate`
   * has not been re-run since the schema was last updated).
   *
   * Use this ONLY for new models until the generated client is refreshed:
   *   const items = await this.prisma.db.followerSnapshot.findMany(...)
   *
   * @internal Remove once `prisma generate` has been re-run.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get db(): any {
    return this;
  }
}
