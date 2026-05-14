import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(email: string, name?: string, referredBy?: string) {
    const normalized = email.toLowerCase().trim();

    // Check if already on waitlist
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "waitlist_entries" WHERE email = $1 LIMIT 1`,
      normalized,
    ).catch(() => []);

    if (existing.length > 0) {
      throw new ConflictException('This email is already on the waitlist');
    }

    // Get current count for position
    const countResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "waitlist_entries"`,
    ).catch(() => [{ count: BigInt(0) }]);
    const position = Number(countResult[0]?.count ?? 0) + 1;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "waitlist_entries" (id, email, name, referred_by, position, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      normalized,
      name ?? null,
      referredBy ?? null,
      position,
    );

    return { position, email: normalized };
  }

  async getCount() {
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "waitlist_entries"`,
    ).catch(() => [{ count: BigInt(0) }]);
    return { count: Number(result[0]?.count ?? 0) };
  }
}
