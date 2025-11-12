export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type Log = {
  id: string;
  userId: string | null;
  action: LogAction;
  entity: string;
  entityId: string;
  changes: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  tenantId: string | null;
  timestamp: string;
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
};

export type LogsResponse = {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
};

export type LogsFilters = {
  userId?: string;
  action?: LogAction;
  entity?: string;
  entities?: string[];
  entityId?: string;
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
};
