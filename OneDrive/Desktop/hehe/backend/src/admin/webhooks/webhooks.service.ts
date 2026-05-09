import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminWebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.db.adminWebhook.findMany({ orderBy: { createdAt: 'desc' }, include: { deliveries: { take: 1, orderBy: { createdAt: 'desc' } } } });
  }

  create(data: { eventType: string; event_type?: string; url: string; active?: boolean }) {
    return this.prisma.db.adminWebhook.create({ data: { eventType: data.eventType ?? data.event_type, url: data.url, active: data.active ?? true } });
  }

  update(id: string, data: { eventType?: string; event_type?: string; url?: string; active?: boolean }) {
    return this.prisma.db.adminWebhook.update({
      where: { id },
      data: { ...(data.eventType || data.event_type ? { eventType: data.eventType ?? data.event_type } : {}), ...(data.url ? { url: data.url } : {}), ...(data.active !== undefined ? { active: data.active } : {}) },
    });
  }

  remove(id: string) {
    return this.prisma.db.adminWebhook.delete({ where: { id } });
  }

  deliveries(id: string) {
    return this.prisma.db.webhookDelivery.findMany({ where: { webhookId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async test(id: string) {
    const webhook = await this.prisma.db.adminWebhook.findUnique({ where: { id } });
    const started = Date.now();
    try {
      const response = await axios.post(webhook.url, { event: webhook.eventType, test: true, sentAt: new Date().toISOString() }, { timeout: 5000 });
      const delivery = await this.prisma.db.webhookDelivery.create({
        data: { webhookId: id, status: 'success', statusCode: response.status, responseBody: JSON.stringify(response.data).slice(0, 2000), responseTimeMs: Date.now() - started },
      });
      await this.prisma.db.adminWebhook.update({ where: { id }, data: { lastTriggered: new Date(), deliveryStatus: 'success' } });
      return delivery;
    } catch (error) {
      const delivery = await this.prisma.db.webhookDelivery.create({
        data: { webhookId: id, status: 'failed', error: error instanceof Error ? error.message : 'Webhook failed', responseTimeMs: Date.now() - started },
      });
      await this.prisma.db.adminWebhook.update({ where: { id }, data: { lastTriggered: new Date(), deliveryStatus: 'failed' } });
      return delivery;
    }
  }
}
