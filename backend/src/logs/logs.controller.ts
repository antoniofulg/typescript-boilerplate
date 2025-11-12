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

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async findAll(
    @Query() query: FindLogsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Only SUPER_USER and ADMIN can access logs
    if (user.role !== UserRole.SUPER_USER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas SUPER_USER e ADMIN podem visualizar logs',
      );
    }

    return this.logsService.findAll(query, user.role, user.tenantId);
  }
}
