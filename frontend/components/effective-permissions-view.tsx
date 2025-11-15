'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// Tooltip temporarily disabled - component will work without it
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type {
  Permission,
  UserRole,
  UserPermissionOverride,
  EffectivePermissions,
} from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';
import {
  aggregateEffectivePermissions,
  filterPermissionsByDomain,
  getUniqueDomains,
  getPermissionScope,
  getPermissionDetail,
  isPermissionAllowed,
  isPermissionDenied,
} from '@/lib/permissionsUtils';

type EffectivePermissionsViewProps = {
  token: string | null;
  userId: string;
};

type PermissionState = 'allowed' | 'denied' | 'not_granted';

export function EffectivePermissionsView({
  token,
  userId,
}: EffectivePermissionsViewProps) {
  const [mounted, setMounted] = useState(false);
  const [effectivePermissions, setEffectivePermissions] =
    useState<EffectivePermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [, setUserOverrides] = useState<UserPermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [useBackendEndpoint, setUseBackendEndpoint] = useState(true);
  const toast = useToast();

  const apiService = useMemo(() => new AuthApiService(token), [token]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (token) {
      apiService.setToken(token);
    }
  }, [token, apiService]);

  const loadEffectivePermissions = async () => {
    setLoading(true);
    try {
      if (useBackendEndpoint) {
        try {
          const data = await apiService.getEffectivePermissions(userId);
          setEffectivePermissions(data);
          // Also load all permissions for display
          const permissionsData = await apiService.getPermissions();
          setAllPermissions(permissionsData);
        } catch (error) {
          // If backend endpoint doesn't exist, fallback to local aggregation
          console.warn(
            'Backend endpoint not available, using local aggregation',
            error,
          );
          setUseBackendEndpoint(false);
          await loadEffectivePermissionsLocal();
        }
      } else {
        await loadEffectivePermissionsLocal();
      }
    } catch (error) {
      toast.error('Erro ao carregar permissões efetivas', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEffectivePermissionsLocal = async () => {
    try {
      const [permissionsData, userRolesData, userOverridesData] =
        await Promise.all([
          apiService.getPermissions(),
          apiService.getUserRoles(userId),
          apiService.getUserPermissionOverrides(userId),
        ]);

      setAllPermissions(permissionsData);
      setUserRoles(userRolesData);
      setUserOverrides(userOverridesData);

      // Build role-permissions map
      const rolePermissionsMap = new Map<string, Permission[]>();
      for (const userRole of userRolesData) {
        try {
          const rolePermissions = await apiService.getRolePermissions(
            userRole.role.id,
          );
          rolePermissionsMap.set(userRole.role.id, rolePermissions);
        } catch (error) {
          console.error(
            `Error loading permissions for role ${userRole.role.id}:`,
            error,
          );
          rolePermissionsMap.set(userRole.role.id, []);
        }
      }

      // Aggregate locally
      const aggregated = aggregateEffectivePermissions(
        userRolesData,
        rolePermissionsMap,
        userOverridesData,
      );

      setEffectivePermissions(aggregated);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (mounted && token && userId) {
      void loadEffectivePermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token, userId]);

  const getPermissionState = (permissionKey: string): PermissionState => {
    if (!effectivePermissions) return 'not_granted';

    if (isPermissionDenied(permissionKey, effectivePermissions)) {
      return 'denied';
    }
    if (isPermissionAllowed(permissionKey, effectivePermissions)) {
      return 'allowed';
    }
    return 'not_granted';
  };

  const getPermissionSource = (permissionKey: string): string => {
    if (!effectivePermissions) return '';

    const detail = getPermissionDetail(permissionKey, effectivePermissions);
    if (!detail) return '';

    if (detail.source === 'user') {
      return `Override do usuário (${detail.grantType})`;
    }

    if (
      detail.source === 'role' &&
      detail.roleIds &&
      detail.roleIds.length > 0
    ) {
      const roleNames = detail.roleIds
        .map((roleId) => {
          const userRole = userRoles.find((ur) => ur.role.id === roleId);
          return userRole?.role.name || roleId;
        })
        .join(', ');
      return `Role(s): ${roleNames}`;
    }

    return '';
  };

  const filteredPermissions = useMemo(() => {
    let filtered = allPermissions;

    // Filter by domain
    if (domainFilter) {
      filtered = filterPermissionsByDomain(filtered, domainFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.key.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [allPermissions, domainFilter, searchQuery]);

  const domains = useMemo(
    () => getUniqueDomains(allPermissions),
    [allPermissions],
  );

  const getStateIcon = (state: PermissionState) => {
    switch (state) {
      case 'allowed':
        return (
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
        );
      case 'denied':
        return <XCircle className="size-5 text-red-600 dark:text-red-400" />;
      case 'not_granted':
        return <HelpCircle className="size-5 text-muted-foreground" />;
    }
  };

  const getStateLabel = (state: PermissionState) => {
    switch (state) {
      case 'allowed':
        return 'Permitida';
      case 'denied':
        return 'Negada';
      case 'not_granted':
        return 'Não concedida';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Permissões Efetivas</h2>
        <Button
          variant="outline"
          onClick={() => void loadEffectivePermissions()}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Atualizar
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar permissões..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar permissões"
          />
        </div>
        <Select
          value={domainFilter || 'all'}
          onValueChange={(value) => {
            setDomainFilter(value === 'all' ? null : value);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por domínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os domínios</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {effectivePermissions && (
            <div className="flex gap-4 rounded-md border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">
                  Permitidas: {effectivePermissions.allowed.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium">
                  Negadas: {effectivePermissions.denied.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Não concedidas:{' '}
                  {allPermissions.length -
                    effectivePermissions.allowed.length -
                    effectivePermissions.denied.length}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Chave de Permissão</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma permissão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((permission) => {
                    const state = getPermissionState(permission.key);
                    const source = getPermissionSource(permission.key);
                    const scope = getPermissionScope(permission.key);
                    const detail = effectivePermissions
                      ? getPermissionDetail(
                          permission.key,
                          effectivePermissions,
                        )
                      : null;

                    const tooltipText = (() => {
                      if (state === 'denied') {
                        return `Negada${detail?.source === 'user' ? ' por override do usuário' : detail?.source === 'role' ? ' por role' : ''}. Overrides de DENY têm precedência sobre ALLOW.`;
                      }
                      if (state === 'allowed') {
                        return `Permitida${source ? ` via ${source}` : ''}.`;
                      }
                      return 'Não concedida por nenhuma role ou override.';
                    })();

                    return (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div
                            className="flex items-center gap-2"
                            title={tooltipText}
                          >
                            {getStateIcon(state)}
                            <span className="text-sm">
                              {getStateLabel(state)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{permission.key}</code>
                            {scope && (
                              <Badge variant="outline" className="text-xs">
                                {scope === 'own' ? 'próprio' : 'qualquer'}
                              </Badge>
                            )}
                            {scope === 'own' && (
                              <span title="Esta permissão se aplica apenas a recursos próprios do usuário. A verificação de propriedade deve ser feita no backend.">
                                <HelpCircle className="size-3 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {source ? (
                            <span className="text-sm text-muted-foreground">
                              {source}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
