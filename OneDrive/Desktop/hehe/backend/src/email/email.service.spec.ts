import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('EmailService', () => {
  let service: EmailService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    service = new EmailService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends welcome emails with SendGrid', async () => {
    process.env.EMAIL_SERVICE = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'SG.test';
    process.env.EMAIL_FROM = 'hello@example.com';
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);

    const result = await service.sendWelcomeEmail('user@example.com', 'Team <One>');

    expect(result).toEqual({ sent: true });
    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test');
    expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      from: 'hello@example.com',
      subject: 'Welcome to Team <One>',
      html: expect.stringContaining('Team &lt;One&gt;'),
    }));
  });

  it('sends payment success emails with SMTP', async () => {
    process.env.EMAIL_SERVICE = 'nodemailer';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    const sendMail = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const result = await service.sendPaymentSuccessEmail(
      'user@example.com',
      'pro',
      new Date('2026-06-01T00:00:00.000Z'),
    );

    expect(result).toEqual({ sent: true });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: 'Payment successful',
    }));
  });

  it('skips email when provider is not configured', async () => {
    delete process.env.EMAIL_SERVICE;

    await expect(
      service.sendPublishFailureEmail('user@example.com', 'post-1', ['twitter'], 'boom'),
    ).resolves.toEqual({ sent: false });
  });
});
