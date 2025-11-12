import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * Guard that redirects authenticated users away from auth routes
 * Returns a 403 with redirect information if user is already authenticated
 */
@Injectable()
export class RedirectIfAuthenticatedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route is not public, let other guards handle it
    if (!isPublic) {
      return true;
    }

    // Try to get authenticated user from token
    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          // No secret configured, allow access
          return true;
        }

        // Verify and decode token
        const payload = this.jwtService.verify<CurrentUserPayload>(token, {
          secret: jwtSecret,
        });

        if (payload) {
          // User is authenticated, determine redirect path based on user role
          const redirectPath = this.getRedirectPathForRole(payload.role);

          throw new HttpException(
            {
              message: 'Usuário já autenticado',
              redirectTo: redirectPath,
              user: {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
              },
            },
            HttpStatus.FORBIDDEN,
          );
        }
      } catch (error) {
        // If it's our redirect exception, re-throw it
        if (
          error instanceof HttpException &&
          error.getStatus() === (HttpStatus.FORBIDDEN as number)
        ) {
          throw error;
        }
        // If token is invalid/expired, allow access (user is not authenticated)
      }
    }

    // User is not authenticated, allow access to auth routes
    return true;
  }

  /**
   * Extracts JWT token from Authorization header
   */
  private extractTokenFromHeader(request: {
    headers?: { authorization?: string };
  }): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Returns the default redirect path for each user role
   */
  private getRedirectPathForRole(role: string): string {
    switch (role) {
      case 'SUPER_USER':
        return '/dashboard';
      case 'ADMIN':
      case 'OPERATOR':
      case 'USER':
      default:
        return '/';
    }
  }
}
