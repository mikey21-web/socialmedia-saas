import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostsetDto } from './dto/create-postset.dto';

@Injectable()
export class PostsetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(teamId: string, dto: CreatePostsetDto) {
    return this.prisma.postSet.create({
      data: {
        teamId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  findAll(teamId: string) {
    return this.prisma.postSet.findMany({
      where: { teamId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(teamId: string, id: string) {
    const postSet = await this.prisma.postSet.findFirst({
      where: { id, teamId, deletedAt: null },
      include: {
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!postSet) {
      throw new NotFoundException('Post set not found');
    }

    return postSet;
  }

  async remove(teamId: string, id: string) {
    const existing = await this.prisma.postSet.findFirst({
      where: { id, teamId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Post set not found');
    }

    await this.prisma.postSet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
