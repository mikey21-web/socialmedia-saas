import { Injectable } from '@nestjs/common';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminEmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  list() {
    return this.prisma.db.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  create(data: { slug: string; subject: string; htmlBody?: string; html_body?: string; textBody?: string; text_body?: string; variables?: unknown }) {
    return this.prisma.db.emailTemplate.create({
      data: { slug: data.slug, subject: data.subject, htmlBody: data.htmlBody ?? data.html_body ?? '', textBody: data.textBody ?? data.text_body, variables: data.variables ?? [] },
    });
  }

  update(id: string, data: { slug?: string; subject?: string; htmlBody?: string; html_body?: string; textBody?: string; text_body?: string; variables?: unknown }) {
    return this.prisma.db.emailTemplate.update({
      where: { id },
      data: {
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.subject ? { subject: data.subject } : {}),
        ...(data.htmlBody !== undefined || data.html_body !== undefined ? { htmlBody: data.htmlBody ?? data.html_body } : {}),
        ...(data.textBody !== undefined || data.text_body !== undefined ? { textBody: data.textBody ?? data.text_body } : {}),
        ...(data.variables !== undefined ? { variables: data.variables } : {}),
      },
    });
  }

  async sendTest(id: string, to?: string) {
    const template = await this.prisma.db.emailTemplate.findUnique({ where: { id } });
    const recipient = to ?? process.env.ADMIN_EMAIL ?? process.env.FROM_EMAIL;
    if (!recipient) return { sent: false, reason: 'ADMIN_EMAIL or FROM_EMAIL is not configured' };
    const sender = this.email as unknown as { send?: (message: { to: string; subject: string; html: string; text?: string }) => Promise<unknown> };
    if (typeof sender.send === 'function') {
      await sender.send({ to: recipient, subject: `[Test] ${template.subject}`, html: template.htmlBody, text: template.textBody ?? undefined });
      return { sent: true, to: recipient };
    }
    return { sent: false, reason: 'Email provider is not configured' };
  }
}
