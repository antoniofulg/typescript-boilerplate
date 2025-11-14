import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService, Resource } from '../../rbac/rbac.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private rbacService: RbacService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserPayload;
      params?: Record<string, string>;
      body?: Record<string, unknown>;
    }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get permission from metadata
    const permission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!permission) {
      // No permission required, allow access
      return true;
    }

    // Extract resource from request (if available)
    const resource: Resource | undefined = this.extractResource(request);

    // Check permission
    const hasPermission = await this.rbacService.hasPermission(
      user.userId,
      permission,
      resource,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permission: ${permission}`,
      );
    }

    return true;
  }

  /**
   * Extract resource from request for :own checks
   */
  private extractResource(request: {
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  }): Resource | undefined {
    // Try to get ownerId from params (e.g., /users/:id where id is the owner)
    // or from body
    const ownerId =
      request.params?.id ||
      request.params?.userId ||
      (request.body?.ownerId as string) ||
      (request.body?.userId as string);

    if (ownerId) {
      return { ownerId };
    }

    return undefined;
  }
}
