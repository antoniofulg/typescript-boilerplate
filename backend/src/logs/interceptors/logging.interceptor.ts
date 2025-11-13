import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { LogsService } from '../logs.service';
import { LogAction } from '@prisma/client';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';

// Fields that should not be logged (sensitive data)
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'passwordConfirmation',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserPayload }>();
    const method = request.method;
    const url = request.url;
    const body = request.body as unknown;
    const params = request.params as Record<string, string>;
    const ip = request.ip;
    const headers = request.headers;
    const user = request.user;

    // Only log write operations (POST, PATCH, PUT, DELETE)
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip logging for auth endpoints (login, register) to avoid logging passwords
    if (url.startsWith('/auth')) {
      return next.handle();
    }

    // Skip logging for the logs endpoint itself
    if (url.startsWith('/logs')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          void (async () => {
            try {
              const userAgent =
                typeof headers['user-agent'] === 'string'
                  ? headers['user-agent']
                  : undefined;
              await this.logOperation(
                method,
                url,
                body,
                params,
                user,
                ip,
                userAgent,
                response,
              );
            } catch (error) {
              // Don't break the application if logging fails
              console.error('Failed to log operation:', error);
            }
          })();
        },
        error: () => {
          // Optionally log errors too, but for now we'll skip
          // to avoid logging failed operations
        },
      }),
    );
  }

  private async logOperation(
    method: string,
    url: string,
    body: unknown,
    params: Record<string, string>,
    user: CurrentUserPayload | undefined,
    ip: string | undefined,
    userAgent: string | undefined,
    response: unknown,
  ): Promise<void> {
    // Determine action based on HTTP method
    let action: LogAction;
    if (method === 'POST') {
      action = LogAction.CREATE;
    } else if (method === 'PATCH' || method === 'PUT') {
      action = LogAction.UPDATE;
    } else if (method === 'DELETE') {
      action = LogAction.DELETE;
    } else {
      return; // Should not happen, but just in case
    }

    // Extract entity name from URL
    // Examples: /users -> User, /tenants -> Tenant, /users/123 -> User
    const entity = this.extractEntityName(url);

    // Extract entity ID from params or response
    const entityId = this.extractEntityId(params, response, action);

    // Prepare changes data
    const changes = this.prepareChanges(body, response, action);

    // Get user info
    const userId = user?.userId;
    const tenantId = user?.tenantId;

    await this.logsService.createLog({
      userId,
      action,
      entity,
      entityId,
      changes,
      ipAddress: ip,
      userAgent,
      tenantId,
    });
  }

  private extractEntityName(url: string): string {
    // Remove query parameters and hash fragments before processing
    // Example: /users?notify=true -> /users
    const urlWithoutQuery = url.split('?')[0].split('#')[0];

    // Remove leading slash and split by /
    const parts = urlWithoutQuery
      .split('/')
      .filter((p) => p && !p.match(/^\d+$/));
    if (parts.length === 0) {
      return 'Unknown';
    }

    // Get the first part (entity name)
    const entityName = parts[0];

    // Convert to PascalCase (e.g., users -> User, tenants -> Tenant)
    return (
      entityName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('') || 'Unknown'
    );
  }

  private extractEntityId(
    params: Record<string, string>,
    response: unknown,
    action: LogAction,
  ): string {
    // Try to get ID from params first
    if (params.id) {
      return params.id;
    }

    // For CREATE, try to get ID from response
    if (
      action === LogAction.CREATE &&
      response &&
      typeof response === 'object'
    ) {
      const responseObj = response as Record<string, unknown>;
      if (responseObj.id && typeof responseObj.id === 'string') {
        return responseObj.id;
      }
    }

    // Fallback: try to find ID parameter with common naming patterns
    // Check for keys ending with 'Id' (camelCase) or '_id' (snake_case)
    // Note: We already checked for exact 'id' above, so skip it here
    for (const key in params) {
      const lowerKey = key.toLowerCase();
      // Match only keys that end with 'Id' (camelCase) or '_id' (snake_case)
      // Examples: 'userId', 'tenantId', 'entityId', 'user_id', 'tenant_id'
      // This ensures we don't match unrelated parameters that happen to contain 'id'
      if (
        (key.length > 2 && key.endsWith('Id')) ||
        (lowerKey.length > 3 && lowerKey.endsWith('_id'))
      ) {
        return params[key];
      }
    }

    return 'unknown';
  }

  private prepareChanges(
    body: unknown,
    response: unknown,
    action: LogAction,
  ): Record<string, unknown> {
    if (action === LogAction.CREATE) {
      // For CREATE, log the created data (filtered)
      if (body && typeof body === 'object') {
        return this.filterSensitiveFields(body as Record<string, unknown>);
      }
      return {};
    }

    if (action === LogAction.UPDATE) {
      // For UPDATE, log only the changed fields from body
      if (body && typeof body === 'object') {
        return this.filterSensitiveFields(body as Record<string, unknown>);
      }
      return {};
    }

    if (action === LogAction.DELETE) {
      // For DELETE, log minimal info (just that it was deleted)
      return { deleted: true };
    }

    return {};
  }

  private filterSensitiveFields(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (
        SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        filtered[key] = '[FILTERED]';
        continue;
      }

      // Recursively filter the value (handles objects, arrays, and primitives)
      filtered[key] = this.filterValue(value);
    }

    return filtered;
  }

  private filterValue(value: unknown): unknown {
    // Handle arrays - recursively filter each element
    if (Array.isArray(value)) {
      return value.map((item) => this.filterValue(item));
    }

    // Handle plain objects - recursively filter all properties
    if (value && typeof value === 'object') {
      return this.filterSensitiveFields(value as Record<string, unknown>);
    }

    // Return primitives as-is
    return value;
  }
}
