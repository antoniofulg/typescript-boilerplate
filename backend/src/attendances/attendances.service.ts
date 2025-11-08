import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendancesService {
  constructor(private prisma: PrismaService) {}

  // Placeholder methods - to be implemented
  async findAll() {
    return this.prisma.attendance.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
      include: {
        user: true,
        session: true,
      },
    });
  }
}
