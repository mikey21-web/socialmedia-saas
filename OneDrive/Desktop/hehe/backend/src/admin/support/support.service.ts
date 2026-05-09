import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSupportService {
  constructor(private readonly prisma: PrismaService) {}

  tickets(query: { status?: string; priority?: string }) {
    return this.prisma.db.supportTicket.findMany({
      where: { ...(query.status ? { status: query.status } : {}), ...(query.priority ? { priority: query.priority } : {}) },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  async create(data: { teamId: string; subject: string; description: string; priority?: string; assignedTo?: string; assigned_to?: string }) {
    const ticket = await this.prisma.db.supportTicket.create({
      data: { teamId: data.teamId, subject: data.subject, description: data.description, priority: data.priority ?? 'normal', assignedTo: data.assignedTo ?? data.assigned_to },
    });
    await this.prisma.db.supportTicketMessage.create({ data: { ticketId: ticket.id, author: 'system', body: data.description } });
    return ticket;
  }

  update(id: string, data: { status?: string; priority?: string; assignedTo?: string; assigned_to?: string }) {
    return this.prisma.db.supportTicket.update({
      where: { id },
      data: { ...(data.status ? { status: data.status } : {}), ...(data.priority ? { priority: data.priority } : {}), ...(data.assignedTo !== undefined || data.assigned_to !== undefined ? { assignedTo: data.assignedTo ?? data.assigned_to } : {}) },
    });
  }

  messages(id: string) {
    return this.prisma.db.supportTicketMessage.findMany({ where: { ticketId: id }, orderBy: { createdAt: 'asc' } });
  }
}
