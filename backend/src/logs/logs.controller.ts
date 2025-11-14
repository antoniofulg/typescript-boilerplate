import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { FindLogsDto } from './dto/find-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { getUserRoleFromRbac } from '../auth/helpers/role-helper';
import { PrismaService } from '../prisma/prisma.service';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Query() query: FindLogsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Get role from RBAC system
    const role = await getUserRoleFromRbac(this.prisma, user.userId);

    // Only SUPER_USER and ADMIN can access logs
    if (role !== UserRole.SUPER_USER && role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas SUPER_USER e ADMIN podem visualizar logs',
      );
    }

    return this.logsService.findAll(query, role, user.tenantId);
  }
}
