import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface ApprovalEmailPayload {
  postId: string;
  teamId: string;
  title: string;
  content: string;
  platform: string;
  recipientEmail: string;
}

@Injectable()
export class ApprovalEmailService {
  private readonly logger = new Logger(ApprovalEmailService.name);
  private readonly baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  constructor(private readonly prisma: PrismaService) {}

  async createTokenAndSendEmail(payload: ApprovalEmailPayload): Promise<string> {
    const token = randomBytes(16).toString('hex'); // 32-char hex
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    await this.prisma.approvalToken.create({
      data: {
        token,
        postId: payload.postId,
        teamId: payload.teamId,
        expiresAt,
      },
    });

    const approveUrl = `${this.baseUrl}/approval/${token}`;

    // Build email HTML
    const html = this.buildEmailHtml({
      title: payload.title,
      content: payload.content,
      platform: payload.platform,
      approveUrl,
    });

    // Send email via configured provider
    await this.sendEmail({
      to: payload.recipientEmail,
      subject: `Approve Post: ${payload.title}`,
      html,
    });

    return token;
  }

  private buildEmailHtml(opts: {
    title: string;
    content: string;
    platform: string;
    approveUrl: string;
  }): string {
    const { title, content, platform, approveUrl } = opts;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e4e4e7;">
    <h2 style="margin: 0 0 4px; font-size: 18px; color: #18181b;">New Post Ready for Approval</h2>
    <p style="margin: 0 0 20px; font-size: 13px; color: #71717a;">Platform: ${platform}</p>

    <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600; font-size: 14px; color: #18181b;">${this.escapeHtml(title)}</p>
      <p style="margin: 0; font-size: 13px; color: #3f3f46; white-space: pre-wrap; line-height: 1.5;">${this.escapeHtml(content.slice(0, 500))}${content.length > 500 ? '...' : ''}</p>
    </div>

    <div style="display: flex; gap: 12px;">
      <a href="${approveUrl}" style="display: inline-block; padding: 12px 32px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; text-align: center;">Review & Approve</a>
    </div>

    <p style="margin: 24px 0 0; font-size: 11px; color: #a1a1aa;">This link expires in 7 days. You'll review the post and choose to approve or reject on the next page.</p>
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async sendEmail(opts: { to: string; subject: string; html: string }) {
    // Use SendGrid / Nodemailer / Resend based on env config
    const provider = process.env.EMAIL_PROVIDER ?? 'log';

    if (provider === 'log') {
      this.logger.log(`📧 [DEV] Email to ${opts.to}: ${opts.subject}`);
      this.logger.debug(opts.html);
      return;
    }

    // Resend integration
    if (provider === 'resend') {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'Diyaa AI <noreply@diyaa.ai>',
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      return;
    }

    this.logger.warn(`Unknown email provider: ${provider}, falling back to log`);
    this.logger.log(`📧 Email to ${opts.to}: ${opts.subject}`);
  }
}
