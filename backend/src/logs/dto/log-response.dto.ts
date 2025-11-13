import { LogAction } from '@prisma/client';

export class LogResponseDto {
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
}
