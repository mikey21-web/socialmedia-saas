import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendWelcomeEmail(email: string, teamName: string) {
    return this.send({
      to: email,
      subject: `Welcome to ${teamName}`,
      text: `Welcome to ${teamName}. Your workspace is ready.`,
      html: `<p>Welcome to <strong>${this.escapeHtml(teamName)}</strong>. Your workspace is ready.</p>`,
    });
  }

  async sendPaymentSuccessEmail(email: string, plan: string, renewalDate: Date | null) {
    const renewal = renewalDate ? renewalDate.toISOString().slice(0, 10) : 'your next billing cycle';
    return this.send({
      to: email,
      subject: 'Payment successful',
      text: `Your ${plan} subscription is active. Renewal date: ${renewal}.`,
      html: `<p>Your <strong>${this.escapeHtml(plan)}</strong> subscription is active.</p><p>Renewal date: ${this.escapeHtml(renewal)}.</p>`,
    });
  }

  async sendPublishFailureEmail(
    email: string,
    postId: string,
    platforms: string[],
    error: string,
  ) {
    return this.send({
      to: email,
      subject: 'Post publishing failed',
      text: `Post ${postId} failed on ${platforms.join(', ')}: ${error}`,
      html: `<p>Post <strong>${this.escapeHtml(postId)}</strong> failed on ${this.escapeHtml(platforms.join(', '))}.</p><p>${this.escapeHtml(error)}</p>`,
    });
  }

  private async send(message: EmailMessage) {
    const service = process.env.EMAIL_SERVICE;
    if (service === 'sendgrid') {
      const apiKey = process.env.SENDGRID_API_KEY;
      const from = process.env.EMAIL_FROM ?? process.env.SENDGRID_FROM_EMAIL;
      if (!apiKey || !from) {
        this.logger.warn('SendGrid email skipped because credentials are incomplete');
        return { sent: false };
      }
      sgMail.setApiKey(apiKey);
      await sgMail.send({ ...message, from });
      return { sent: true };
    }

    if (service === 'nodemailer') {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.EMAIL_FROM ?? user;
      if (!host || !user || !pass || !from) {
        this.logger.warn('SMTP email skipped because credentials are incomplete');
        return { sent: false };
      }
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      await transporter.sendMail({ ...message, from });
      return { sent: true };
    }

    this.logger.warn('Email skipped because EMAIL_SERVICE is not configured');
    return { sent: false };
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
