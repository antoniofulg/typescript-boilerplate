'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Log, LogsResponse, LogsFilters, LogAction } from '@/types/log';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { Filter, X, ChevronDown } from 'lucide-react';

type LogsManagementProps = {
  initialLogs: LogsResponse;
};

const actionLabels: Record<LogAction, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Excluir',
};

const actionVariants: Record<
  LogAction,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
};

const entityLabels: Record<string, string> = {
  Users: 'Usuários',
  Tenants: 'Tenants',
  // Keep singular forms for backward compatibility if needed
  User: 'Usuário',
  Tenant: 'Tenant',
};

// Available entities for filtering
// Note: Entity names must match what's saved in the database (plural form from URL routes)
const availableEntities = [
  { value: 'Users', label: 'Usuários' },
  { value: 'Tenants', label: 'Tenants' },
];

export function LogsManagement({ initialLogs }: LogsManagementProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [limit] = useState(initialLogs.limit);
  const [logs] = useState<Log[]>(initialLogs.logs);
  const [total] = useState(initialLogs.total);
  const [currentPage] = useState(initialLogs.page);

  // Parse query params to filters
  const parseFiltersFromParams = (): LogsFilters => {
    const filters: LogsFilters = {
      page: 1,
      limit: 20,
    };

    const page = searchParams.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        filters.page = pageNum;
      }
    }

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filters.limit = limitNum;
      }
    }

    const action = searchParams.get('action');
    if (action && ['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
      filters.action = action as LogAction;
    }

    // Parse entities (array) - takes precedence over single entity
    const entities = searchParams.get('entities');
    if (entities) {
      const entitiesArray = entities
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e);
      if (entitiesArray.length > 0) {
        filters.entities = entitiesArray;
      }
    } else {
      // Only parse single entity if entities is not present (mutual exclusion)
      const entity = searchParams.get('entity');
      if (entity) {
        filters.entity = entity;
      }
    }

    const entityId = searchParams.get('entityId');
    if (entityId) {
      filters.entityId = entityId;
    }

    const userId = searchParams.get('userId');
    if (userId) {
      filters.userId = userId;
    }

    const startDate = searchParams.get('startDate');
    if (startDate) {
      filters.startDate = startDate;
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      filters.endDate = endDate;
    }

    const tenantId = searchParams.get('tenantId');
    if (tenantId) {
      filters.tenantId = tenantId;
    }

    return filters;
  };

  // Initialize state from URL params and initial logs
  const [filters, setFilters] = useState<LogsFilters>(() =>
    parseFiltersFromParams(),
  );

  // Update URL with current filters
  const updateURL = (newFilters: LogsFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays (for entities)
        if (Array.isArray(value) && value.length > 0) {
          params.append(key, value.join(','));
        } else if (!Array.isArray(value)) {
          params.append(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use replace to avoid adding to history on every filter change
    router.replace(newUrl, { scroll: false });
  };

  // Sync filters when URL params change (e.g., browser back/forward or initial load)
  // This effect synchronizes external state (URL params) with React state
  useEffect(() => {
    const currentUrlFilters = parseFiltersFromParams();
    const currentFiltersStr = JSON.stringify(filters);
    const urlFiltersStr = JSON.stringify(currentUrlFilters);

    // Only update if filters actually changed to avoid unnecessary renders
    if (currentFiltersStr !== urlFiltersStr) {
      setFilters(currentUrlFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilterChange = (key: keyof LogsFilters, value: unknown) => {
    const newFilters: LogsFilters = { ...filters, page: 1 };

    // Remove entity if using entities array and vice versa
    if (key === 'entities') {
      newFilters.entities = value as string[] | undefined;
      delete newFilters.entity;
    } else if (key === 'entity') {
      newFilters.entity = value as string | undefined;
      delete newFilters.entities;
    } else {
      newFilters[key] = value as never;
    }

    updateURL(newFilters);
    router.refresh();
  };

  const handleEntityToggle = (entityValue: string) => {
    const currentEntities = filters.entities || [];
    const newEntities = currentEntities.includes(entityValue)
      ? currentEntities.filter((e) => e !== entityValue)
      : [...currentEntities, entityValue];
    handleFilterChange(
      'entities',
      newEntities.length > 0 ? newEntities : undefined,
    );
  };

  const handleClearFilters = () => {
    const clearedFilters: LogsFilters = { page: 1, limit: 20 };
    updateURL(clearedFilters);
    router.refresh();
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    updateURL(newFilters);
    router.refresh();
  };

  const formatChanges = (changes: Record<string, unknown>): string => {
    try {
      if (Object.keys(changes).length === 0) {
        return '-';
      }
      return JSON.stringify(changes, null, 2);
    } catch {
      return String(changes);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // Check if date is valid (Invalid Date objects have NaN for getTime())
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(total / limit);
  const selectedEntities = filters.entities || [];
  const hasActiveFilters =
    filters.userId ||
    filters.action ||
    filters.entity ||
    selectedEntities.length > 0 ||
    filters.entityId ||
    filters.startDate ||
    filters.endDate ||
    filters.tenantId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Sistema</CardTitle>
        <CardDescription>
          Visualize todas as operações realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="size-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select
                value={filters.action || undefined}
                onValueChange={(value) =>
                  handleFilterChange(
                    'action',
                    value === 'all' ? undefined : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="CREATE">Criar</SelectItem>
                  <SelectItem value="UPDATE">Atualizar</SelectItem>
                  <SelectItem value="DELETE">Excluir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Entidades
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    type="button"
                  >
                    <span>
                      {selectedEntities.length > 0
                        ? `${selectedEntities.length} entidade(s) selecionada(s)`
                        : 'Selecione as entidades'}
                    </span>
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {availableEntities.map((entity) => (
                    <DropdownMenuCheckboxItem
                      key={entity.value}
                      checked={selectedEntities.includes(entity.value)}
                      onCheckedChange={() => handleEntityToggle(entity.value)}
                    >
                      {entity.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Data Inicial
              </label>
              <Input
                type="datetime-local"
                value={filters.startDate || ''}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value || undefined)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Data Final
              </label>
              <Input
                type="datetime-local"
                value={filters.endDate || ''}
                onChange={(e) =>
                  handleFilterChange('endDate', e.target.value || undefined)
                }
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum log encontrado
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Mudanças</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariants[log.action]}>
                          {actionLabels[log.action]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entityLabels[log.entity] || log.entity}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entityId}
                      </TableCell>
                      <TableCell>
                        <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
                          {formatChanges(log.changes)}
                        </pre>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground text-center">
              Mostrando {logs.length} de {total} logs
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
