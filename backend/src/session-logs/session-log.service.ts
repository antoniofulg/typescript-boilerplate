import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionEventType } from '@prisma/client';

export interface LogSessionEventData {
  userId?: string;
  eventType: SessionEventType;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  success?: boolean;
  failureReason?: string;
}

@Injectable()
export class SessionLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log a session event (login, logout, refresh, failed login)
   */
  async logSessionEvent(data: LogSessionEventData): Promise<void> {
    await this.prisma.sessionLog.create({
      data: {
        userId: data.userId || null,
        eventType: data.eventType,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        tenantId: data.tenantId || null,
        success: data.success ?? true,
        failureReason: data.failureReason || null,
      },
    });
  }
}
