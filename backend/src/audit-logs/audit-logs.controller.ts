import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RbacService } from '../rbac/rbac.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly rbacService: RbacService,
  ) {}

  @Get('logs')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Check if user has audit:view permission or system:super_user permission
    const hasAuditPermission = await this.rbacService.hasPermission(
      user.userId,
      'audit:view',
    );
    const isSuperUser = await this.rbacService.hasPermission(
      user.userId,
      'system:super_user',
    );

    if (!isSuperUser && !hasAuditPermission) {
      throw new ForbiddenException(
        'Access denied. Requires system:super_user or audit:view permission.',
      );
    }

    return this.auditLogService.findAll({
      userId,
      action,
      entity,
      entityId,
      tenantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
