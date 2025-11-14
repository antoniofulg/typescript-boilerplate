import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string | null;
  reason?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry (append-only)
   * Can be used within a transaction
   */
  async createAuditLog(
    data: CreateAuditLogData,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    await client.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes as Prisma.InputJsonValue,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        tenantId: data.tenantId || null,
        reason: data.reason || null,
      },
    });
  }

  /**
   * Find all audit logs with filters
   */
  async findAll(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    tenantId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: Array<{
      id: string;
      userId: string | null;
      action: string;
      entity: string;
      entityId: string;
      changes: Record<string, unknown>;
      ipAddress: string | null;
      userAgent: string | null;
      tenantId: string | null;
      recordedAt: Date;
      reason: string | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.startDate || filters.endDate) {
      where.recordedAt = {};
      if (filters.startDate) {
        where.recordedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.recordedAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          recordedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        changes: (log.changes as Record<string, unknown>) || {},
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        tenantId: log.tenantId,
        recordedAt: log.recordedAt,
        reason: log.reason,
      })),
      total,
      page,
      limit,
    };
  }
}
