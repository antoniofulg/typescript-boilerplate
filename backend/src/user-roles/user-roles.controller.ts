import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssignmentService } from '../assignments/assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import type { Request } from 'express';

@Controller('users/:userId/roles')
@UseGuards(JwtAuthGuard)
export class UserRolesController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post(':roleId')
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];

    await this.assignmentService.assignRoleToUser(
      userId,
      roleId,
      user.userId,
      ipAddress,
      userAgent,
    );

    return { message: 'Role assigned to user successfully' };
  }

  @Delete(':roleId')
  async revokeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];

    await this.assignmentService.revokeRoleFromUser(
      userId,
      roleId,
      user.userId,
      ipAddress,
      userAgent,
    );

    return { message: 'Role revoked from user successfully' };
  }
}
