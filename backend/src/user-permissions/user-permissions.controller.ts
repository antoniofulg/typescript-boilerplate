import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssignmentService } from '../assignments/assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { GrantType } from '@prisma/client';
import type { Request } from 'express';

export class GrantUserPermissionDto {
  grantType: GrantType;
  reason?: string;
}

@Controller('users/:userId/permissions')
@UseGuards(JwtAuthGuard)
export class UserPermissionsController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post(':permissionKey')
  async grantPermission(
    @Param('userId') userId: string,
    @Param('permissionKey') permissionKey: string,
    @Body() dto: GrantUserPermissionDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];

    await this.assignmentService.grantUserPermission(
      userId,
      permissionKey,
      dto.grantType,
      user.userId,
      dto.reason,
      ipAddress,
      userAgent,
    );

    return { message: 'Permission override granted successfully' };
  }

  @Delete(':permissionKey')
  async revokePermission(
    @Param('userId') userId: string,
    @Param('permissionKey') permissionKey: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];

    await this.assignmentService.revokeUserPermission(
      userId,
      permissionKey,
      user.userId,
      ipAddress,
      userAgent,
    );

    return { message: 'Permission override revoked successfully' };
  }
}
