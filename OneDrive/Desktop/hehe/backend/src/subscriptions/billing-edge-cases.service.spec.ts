import { BillingEdgeCasesService } from './billing-edge-cases.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockPrisma = {
  subscription: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  team: {
    findUnique: jest.fn(),
  },
};

const mockEmail = {
  sendPaymentFailedEmail: jest.fn().mockResolvedValue({ sent: true }),
};

const mockNotifications = {
  create: jest.fn().mockResolvedValue({}),
};

describe('BillingEdgeCasesService', () => {
  let service: BillingEdgeCasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingEdgeCasesService(
      mockPrisma as unknown as PrismaService,
      mockEmail as unknown as EmailService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  describe('handlePaymentFailed', () => {
    it('marks subscription past_due on first failure', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 's1',
        teamId: 't1',
        team: { members: [{ user: { email: 'admin@team.com' } }] },
      });
      mockPrisma.subscription.update.mockResolvedValue({});

      const result = await service.handlePaymentFailed('cust_123', 1);

      expect(result?.status).toBe('past_due');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'past_due' } }),
      );
      expect(mockEmail.sendPaymentFailedEmail).toHaveBeenCalledWith('admin@team.com');
    });

    it('marks subscription unpaid after 4 failures', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 's1',
        teamId: 't1',
        team: { members: [{ user: { email: 'admin@team.com' } }] },
      });

      const result = await service.handlePaymentFailed('cust_123', 4);

      expect(result?.status).toBe('unpaid');
      expect(mockNotifications.create).toHaveBeenCalledWith(
        't1',
        'payment_failed',
        expect.stringContaining('suspended'),
      );
    });

    it('does nothing if subscription not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      const result = await service.handlePaymentFailed('cust_unknown');
      expect(result).toBeUndefined();
      expect(mockEmail.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleDowngrade', () => {
    it('warns when team exceeds new plan limits', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        members: [{}, {}, {}, {}, {}], // 5 members
        credentials: [{}, {}, {}, {}, {}, {}], // 6 platforms
        subscription: { plan: 'agency' },
      });

      const result = await service.handleDowngrade('t1', 'agency', 'pro');

      expect(result?.violations.length).toBeGreaterThan(0);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        't1',
        'plan_downgrade_warning',
        expect.stringContaining('team members'),
      );
    });

    it('no warning when within limits', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        members: [{}], // 1 member
        credentials: [{}], // 1 platform
      });

      const result = await service.handleDowngrade('t1', 'pro', 'solo');

      expect(result?.violations).toEqual([]);
    });
  });

  describe('handleRefund', () => {
    it('downgrades to free and notifies', async () => {
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.findFirst.mockResolvedValue({ teamId: 't1' });

      await service.handleRefund('cust_123', 999);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cust_123' },
        data: expect.objectContaining({ plan: 'free', status: 'canceled' }),
      });
      expect(mockNotifications.create).toHaveBeenCalled();
    });
  });
});
