'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
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
  Sessions: 'Sessões',
  Projects: 'Projetos',
  Attendances: 'Presenças',
  Votes: 'Votos',
  // Keep singular forms for backward compatibility if needed
  User: 'Usuário',
  Tenant: 'Tenant',
  Session: 'Sessão',
  Project: 'Projeto',
  Attendance: 'Presença',
  Vote: 'Voto',
};

// Available entities for filtering
// Note: Entity names must match what's saved in the database (plural form from URL routes)
const availableEntities = [
  { value: 'Users', label: 'Usuários' },
  { value: 'Tenants', label: 'Tenants' },
  { value: 'Sessions', label: 'Sessões' },
  { value: 'Projects', label: 'Projetos' },
  { value: 'Attendances', label: 'Presenças' },
  { value: 'Votes', label: 'Votos' },
];

export function LogsManagement({ initialLogs }: LogsManagementProps) {
  const { token } = useAuth();
  const toast = useToast();
  const { loading, get } = useApi(token);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [logs, setLogs] = useState<Log[]>(initialLogs.logs);
  const [total, setTotal] = useState(initialLogs.total);
  const [currentPage, setCurrentPage] = useState(initialLogs.page);
  const [limit] = useState(initialLogs.limit);

  // Parse query params to filters
  const parseFiltersFromParams = useCallback((): LogsFilters => {
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
  }, [searchParams]);

  const [filters, setFilters] = useState<LogsFilters>(parseFiltersFromParams);
  const isInitialMount = useRef(true);
  const isUpdatingFromURL = useRef(false);

  // Update URL with current filters
  const updateURL = useCallback(
    (newFilters: LogsFilters) => {
      // Don't update URL if we're currently syncing from URL to avoid loops
      if (isUpdatingFromURL.current) {
        return;
      }

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
    },
    [pathname, router],
  );

  const fetchLogs = useCallback(
    async (newFilters?: LogsFilters) => {
      const activeFilters = { ...filters, ...newFilters };

      // Build query string from filters
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
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
      const endpoint = `/logs${queryString ? `?${queryString}` : ''}`;

      await get<LogsResponse>(endpoint, {
        onSuccess: (data) => {
          if (data) {
            setLogs(data.logs);
            setTotal(data.total);
            setCurrentPage(data.page);
            setFilters(activeFilters);
            // Update URL with the active filters
            updateURL(activeFilters);
          }
        },
        onError: (err) => {
          const errorMessage = err.message || 'Erro desconhecido';
          if (errorMessage.includes('UNAUTHENTICATED') || err.status === 401) {
            window.location.href = '/auth';
            return;
          }
          toast.error('Erro ao carregar logs', {
            description: errorMessage,
          });
        },
      });
    },
    [filters, get, updateURL, toast],
  );

  // Sync filters when URL params change (e.g., browser back/forward or initial load)
  useEffect(() => {
    const urlFilters = parseFiltersFromParams();

    // Use a functional update to compare with current state
    setFilters((currentFilters) => {
      const currentFiltersStr = JSON.stringify(currentFilters);
      const urlFiltersStr = JSON.stringify(urlFilters);

      // Only update if filters actually changed to avoid infinite loops
      if (currentFiltersStr !== urlFiltersStr) {
        isUpdatingFromURL.current = true;

        // Only fetch if URL has filters (not just default page/limit) or page is not 1
        const hasNonDefaultFilters = Object.keys(urlFilters).some(
          (key) =>
            key !== 'page' &&
            key !== 'limit' &&
            urlFilters[key as keyof LogsFilters],
        );

        // On initial mount, use initialLogs if no filters in URL
        if (
          isInitialMount.current &&
          !hasNonDefaultFilters &&
          urlFilters.page === 1
        ) {
          isInitialMount.current = false;
          isUpdatingFromURL.current = false;
          return currentFilters; // Don't change filters
        }

        // Fetch logs if needed
        if (hasNonDefaultFilters || urlFilters.page !== 1) {
          void fetchLogs(urlFilters).finally(() => {
            isUpdatingFromURL.current = false;
          });
        } else {
          isUpdatingFromURL.current = false;
        }

        isInitialMount.current = false;
        return urlFilters;
      }

      return currentFilters;
    });
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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

    void fetchLogs(newFilters);
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
    void fetchLogs(clearedFilters);
  };

  const handlePageChange = (page: number) => {
    void fetchLogs({ ...filters, page });
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
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
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
                    <ChevronDown className="h-4 w-4 opacity-50" />
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
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
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
