import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogAction, Prisma, UserRole } from '@prisma/client';
import { LogResponseDto } from './dto/log-response.dto';
import { FindLogsDto } from './dto/find-logs.dto';

export interface CreateLogData {
  userId?: string;
  action: LogAction;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
}

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: CreateLogData): Promise<LogResponseDto> {
    const log = await this.prisma.log.create({
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToResponseDto(log);
  }

  async findAll(
    filters: FindLogsDto,
    currentUserRole: UserRole,
    currentUserTenantId?: string,
  ): Promise<{
    logs: LogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.LogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    // Support both single entity and multiple entities
    // Priority: entities array over single entity
    if (
      filters.entities &&
      Array.isArray(filters.entities) &&
      filters.entities.length > 0
    ) {
      where.entity = { in: filters.entities };
    } else if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    // Tenant isolation: ADMIN only sees logs from their tenant
    if (currentUserRole !== UserRole.SUPER_USER) {
      // Security: If ADMIN doesn't have a tenantId, return empty results
      // to prevent seeing all logs across all tenants
      if (!currentUserTenantId) {
        return {
          logs: [],
          total: 0,
          page,
          limit,
        };
      }
      where.tenantId = currentUserTenantId;
    } else if (filters.tenantId) {
      // SUPER_USER can filter by tenant
      where.tenantId = filters.tenantId;
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.timestamp.lte = new Date(filters.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.log.count({ where }),
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
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
    tenant?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }): LogResponseDto {
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
      user: log.user || null,
      tenant: log.tenant || null,
    };
  }
}
