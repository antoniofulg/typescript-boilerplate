import { redirect } from 'next/navigation';
import { getLogs } from '@/lib/api-server';
import type { LogsResponse, LogsFilters, LogAction } from '@/types/log';
import { LogsManagement } from '@/components/(superadmin)/logs-management';
import { DashboardErrorBoundary } from '@/components/(superadmin)/dashboard-error-boundary';

type LogsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  let initialLogs: LogsResponse = {
    logs: [],
    total: 0,
    page: 1,
    limit: 20,
  };

  try {
    // Parse search params to filters
    const params = await searchParams;
    const filters: LogsFilters = {
      page: 1,
      limit: 20,
    };

    // Parse page
    if (params.page && typeof params.page === 'string') {
      const pageNum = parseInt(params.page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        filters.page = pageNum;
      }
    }

    // Parse limit
    if (params.limit && typeof params.limit === 'string') {
      const limitNum = parseInt(params.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filters.limit = limitNum;
      }
    }

    // Parse action
    if (
      params.action &&
      typeof params.action === 'string' &&
      ['CREATE', 'UPDATE', 'DELETE'].includes(params.action)
    ) {
      filters.action = params.action as LogAction;
    }

    // Parse entities (array) - takes precedence over single entity
    if (params.entities && typeof params.entities === 'string') {
      const entitiesArray = params.entities
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e);
      if (entitiesArray.length > 0) {
        filters.entities = entitiesArray;
      }
    } else if (params.entity && typeof params.entity === 'string') {
      // Only parse single entity if entities is not present (mutual exclusion)
      filters.entity = params.entity;
    }

    // Parse entityId
    if (params.entityId && typeof params.entityId === 'string') {
      filters.entityId = params.entityId;
    }

    // Parse userId
    if (params.userId && typeof params.userId === 'string') {
      filters.userId = params.userId;
    }

    // Parse dates
    if (params.startDate && typeof params.startDate === 'string') {
      filters.startDate = params.startDate;
    }

    if (params.endDate && typeof params.endDate === 'string') {
      filters.endDate = params.endDate;
    }

    // Parse tenantId
    if (params.tenantId && typeof params.tenantId === 'string') {
      filters.tenantId = params.tenantId;
    }

    initialLogs = await getLogs(filters);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    // Para outros erros, retornar dados vazios e deixar o componente client-side lidar
    initialLogs = {
      logs: [],
      total: 0,
      page: 1,
      limit: 20,
    };
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <LogsManagement initialLogs={initialLogs} />
      </div>
    </DashboardErrorBoundary>
  );
}
