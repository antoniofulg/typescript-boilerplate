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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Permission, Role } from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';
import {
  filterPermissionsByDomain,
  getUniqueDomains,
  getPermissionScope,
} from '@/lib/permissionsUtils';

type RolePermissionsEditorProps = {
  token: string | null;
};

type PermissionState = {
  [roleId: string]: Set<string>; // roleId -> Set of permissionIds
};

export function RolePermissionsEditor({ token }: RolePermissionsEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStates, setPermissionStates] = useState<PermissionState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        apiService.getRoles(),
        apiService.getPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);

      // Load permission states for each role
      const states: PermissionState = {};
      for (const role of rolesData) {
        try {
          const rolePermissions = await apiService.getRolePermissions(role.id);
          states[role.id] = new Set(rolePermissions.map((p) => p.id));
        } catch (error) {
          console.error(
            `Error loading permissions for role ${role.id}:`,
            error,
          );
          states[role.id] = new Set();
        }
      }
      setPermissionStates(states);
    } catch (error) {
      toast.error('Erro ao carregar dados', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token]);

  const filteredPermissions = useMemo(() => {
    let filtered = permissions;

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
  }, [permissions, domainFilter, searchQuery]);

  const domains = useMemo(() => getUniqueDomains(permissions), [permissions]);

  const isPermissionAssigned = (roleId: string, permissionId: string) => {
    return permissionStates[roleId]?.has(permissionId) ?? false;
  };

  const togglePermission = async (roleId: string, permissionId: string) => {
    const isAssigned = isPermissionAssigned(roleId, permissionId);
    const optimisticStates = { ...permissionStates };
    const roleState = new Set(optimisticStates[roleId] || []);
    if (isAssigned) {
      roleState.delete(permissionId);
    } else {
      roleState.add(permissionId);
    }
    optimisticStates[roleId] = roleState;
    setPermissionStates(optimisticStates);

    try {
      if (isAssigned) {
        await apiService.removePermissionFromRole(roleId, permissionId);
      } else {
        await apiService.assignPermissionToRole(roleId, { permissionId });
      }
    } catch (error) {
      // Rollback on error
      setPermissionStates(permissionStates);
      toast.error('Erro ao atualizar permissão', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const handleBulkApply = async () => {
    if (selectedRoles.size === 0 || selectedPermissions.size === 0) {
      toast.warning('Selecione pelo menos uma role e uma permissão');
      return;
    }

    setBulkOperationLoading(true);
    const errors: string[] = [];
    const successes: number[] = [];

    try {
      const promises: Promise<void>[] = [];
      for (const roleId of selectedRoles) {
        for (const permissionId of selectedPermissions) {
          if (!isPermissionAssigned(roleId, permissionId)) {
            promises.push(
              apiService
                .assignPermissionToRole(roleId, { permissionId })
                .then(() => {
                  successes.push(1);
                })
                .catch((error) => {
                  errors.push(
                    `Role ${roles.find((r) => r.id === roleId)?.name}: ${error.message}`,
                  );
                }),
            );
          }
        }
      }

      await Promise.all(promises);

      // Update states optimistically
      const newStates = { ...permissionStates };
      for (const roleId of selectedRoles) {
        const roleState = new Set(newStates[roleId] || []);
        for (const permissionId of selectedPermissions) {
          roleState.add(permissionId);
        }
        newStates[roleId] = roleState;
      }
      setPermissionStates(newStates);

      if (errors.length > 0) {
        toast.warning('Algumas operações falharam', {
          description: `${successes.length} sucesso(s), ${errors.length} erro(s)`,
        });
      } else {
        toast.success('Permissões aplicadas com sucesso', {
          description: `${successes.length} permissão(ões) aplicada(s)`,
        });
      }

      setSelectedRoles(new Set());
      setSelectedPermissions(new Set());
    } catch (error) {
      toast.error('Erro ao aplicar permissões em lote', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedRoles.size === 0 || selectedPermissions.size === 0) {
      toast.warning('Selecione pelo menos uma role e uma permissão');
      return;
    }

    setBulkOperationLoading(true);
    const errors: string[] = [];
    const successes: number[] = [];

    try {
      const promises: Promise<void>[] = [];
      for (const roleId of selectedRoles) {
        for (const permissionId of selectedPermissions) {
          if (isPermissionAssigned(roleId, permissionId)) {
            promises.push(
              apiService
                .removePermissionFromRole(roleId, permissionId)
                .then(() => {
                  successes.push(1);
                })
                .catch((error) => {
                  errors.push(
                    `Role ${roles.find((r) => r.id === roleId)?.name}: ${error.message}`,
                  );
                }),
            );
          }
        }
      }

      await Promise.all(promises);

      // Update states optimistically
      const newStates = { ...permissionStates };
      for (const roleId of selectedRoles) {
        const roleState = new Set(newStates[roleId] || []);
        for (const permissionId of selectedPermissions) {
          roleState.delete(permissionId);
        }
        newStates[roleId] = roleState;
      }
      setPermissionStates(newStates);

      if (errors.length > 0) {
        toast.warning('Algumas operações falharam', {
          description: `${successes.length} sucesso(s), ${errors.length} erro(s)`,
        });
      } else {
        toast.success('Permissões removidas com sucesso', {
          description: `${successes.length} permissão(ões) removida(s)`,
        });
      }

      setSelectedRoles(new Set());
      setSelectedPermissions(new Set());
    } catch (error) {
      toast.error('Erro ao remover permissões em lote', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const togglePermissionSelection = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const selectAllRoles = () => {
    if (selectedRoles.size === roles.length) {
      setSelectedRoles(new Set());
    } else {
      setSelectedRoles(new Set(roles.map((r) => r.id)));
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Editor de Permissões por Role</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleBulkApply}
            disabled={
              bulkOperationLoading ||
              selectedRoles.size === 0 ||
              selectedPermissions.size === 0
            }
            variant="outline"
          >
            {bulkOperationLoading && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Aplicar Selecionadas
          </Button>
          <Button
            onClick={handleBulkRemove}
            disabled={
              bulkOperationLoading ||
              selectedRoles.size === 0 ||
              selectedPermissions.size === 0
            }
            variant="outline"
          >
            {bulkOperationLoading && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Remover Selecionadas
          </Button>
        </div>
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
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        roles.length > 0 && selectedRoles.size === roles.length
                      }
                      onCheckedChange={selectAllRoles}
                      aria-label="Selecionar todas as roles"
                    />
                    <span>Permissão</span>
                  </div>
                </TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Checkbox
                        checked={selectedRoles.has(role.id)}
                        onCheckedChange={() => toggleRoleSelection(role.id)}
                        aria-label={`Selecionar role ${role.name}`}
                      />
                      <code className="text-xs">{role.name}</code>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={roles.length + 1}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma permissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((permission) => {
                  const scope = getPermissionScope(permission.key);
                  return (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={() =>
                              togglePermissionSelection(permission.id)
                            }
                            aria-label={`Selecionar permissão ${permission.key}`}
                          />
                          <div className="flex flex-col">
                            <code className="text-sm">{permission.key}</code>
                            {scope && (
                              <span className="text-xs text-muted-foreground">
                                ({scope === 'own' ? 'próprio' : 'qualquer'})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {roles.map((role) => {
                        const isAssigned = isPermissionAssigned(
                          role.id,
                          permission.id,
                        );
                        return (
                          <TableCell key={role.id} className="text-center">
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() =>
                                togglePermission(role.id, permission.id)
                              }
                              aria-label={`Permissão ${permission.key} para role ${role.name}`}
                              disabled={bulkOperationLoading}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
