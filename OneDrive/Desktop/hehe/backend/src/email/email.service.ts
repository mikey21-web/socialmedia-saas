import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
    const appName = process.env.APP_NAME ?? 'Diyaa AI';
    const dashboardUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000/dashboard';
    return this.send({
      to: email,
      subject: `Welcome to ${appName} — let's get started`,
      text: `Welcome to ${appName}. Your ${teamName} workspace is ready. Connect your first platform, create your first post, and invite your team from ${dashboardUrl}.`,
      html: `<p>Welcome to <strong>${this.escapeHtml(appName)}</strong>. Your <strong>${this.escapeHtml(teamName)}</strong> workspace is ready.</p><ol><li>Connect your first platform.</li><li>Create your first post.</li><li>Invite your team when you are ready.</li></ol><p><a href="${this.escapeHtml(dashboardUrl)}">Open your dashboard</a></p>`,
    });
  }

  async sendPaymentFailedEmail(email: string) {
    return this.send({
      to: email,
      subject: 'Payment failed',
      text: 'Your subscription payment failed. Please update your billing method to keep Pro features active.',
      html: '<p>Your subscription payment failed. Please update your billing method to keep Pro features active.</p>',
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
    if (service === 'resend' || process.env.RESEND_API_KEY) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL;
      if (!apiKey || !from) {
        this.logger.warn('Resend email skipped because credentials are incomplete');
        return { sent: false };
      }
      const resend = new Resend(apiKey);
      await resend.emails.send({ ...message, from });
      return { sent: true };
    }

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
