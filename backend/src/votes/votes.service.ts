import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  // Placeholder methods - to be implemented
  async findAll() {
    return this.prisma.vote.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.vote.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
      },
    });
  }
}

