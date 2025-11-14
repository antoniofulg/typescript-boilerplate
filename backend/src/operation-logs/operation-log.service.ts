import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogAction, Prisma } from '@prisma/client';

export interface CreateOperationLogData {
  userId?: string;
  action: LogAction;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
}

export interface OperationLogResponseDto {
  id: string;
  userId: string | null;
  action: LogAction;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  tenantId: string | null;
  timestamp: Date;
}

@Injectable()
export class OperationLogService {
  constructor(private prisma: PrismaService) {}

  async createLog(
    data: CreateOperationLogData,
  ): Promise<OperationLogResponseDto> {
    const log = await this.prisma.operationLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes as Prisma.InputJsonValue,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        tenantId: data.tenantId || null,
      },
    });

    return this.mapToResponseDto(log);
  }

  async findAll(filters: {
    userId?: string;
    action?: LogAction;
    entity?: string;
    entityId?: string;
    tenantId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: OperationLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OperationLogWhereInput = {};

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
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.mapToResponseDto(log)),
      total,
      page,
      limit,
    };
  }

  private mapToResponseDto(log: {
    id: string;
    userId: string | null;
    action: LogAction;
    entity: string;
    entityId: string;
    changes: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    tenantId: string | null;
    timestamp: Date;
  }): OperationLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      changes: (log.changes as Record<string, unknown>) || {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      tenantId: log.tenantId,
      timestamp: log.timestamp,
    };
  }
}
