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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmModal } from './confirm-modal';
import type { Role, UserRole } from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';

type UserRolesManagerProps = {
  token: string | null;
  userId: string;
};

export function UserRolesManager({ token, userId }: UserRolesManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<Role | null>(null);
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
      const [userRolesData, allRolesData] = await Promise.all([
        apiService.getUserRoles(userId),
        apiService.getRoles(),
      ]);

      setUserRoles(userRolesData);
      setAllRoles(allRolesData);
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
    if (mounted && token && userId) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token, userId]);

  const availableRoles = useMemo(() => {
    const assignedRoleIds = new Set(userRoles.map((ur) => ur.role.id));
    return allRoles.filter((role) => !assignedRoleIds.has(role.id));
  }, [userRoles, allRoles]);

  const handleAssignRole = async () => {
    if (!selectedRoleId) return;

    setAssigning(true);
    const roleToAssign = allRoles.find((r) => r.id === selectedRoleId);
    if (!roleToAssign) return;

    // Optimistic update
    const optimisticUserRoles = [...userRoles, { role: roleToAssign }];
    setUserRoles(optimisticUserRoles);
    setSelectedRoleId('');

    try {
      await apiService.assignRoleToUser(userId, { roleId: selectedRoleId });
      toast.success('Role atribuída com sucesso');
      await loadData(); // Reload to ensure consistency
    } catch (error) {
      // Rollback on error
      setUserRoles(userRoles);
      toast.error('Erro ao atribuir role', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!roleToRemove) return;

    const roleId = roleToRemove.id;
    // Optimistic update
    const optimisticUserRoles = userRoles.filter((ur) => ur.role.id !== roleId);
    setUserRoles(optimisticUserRoles);
    setRemoveConfirmOpen(false);

    try {
      await apiService.removeRoleFromUser(userId, roleId);
      toast.success('Role removida com sucesso');
      await loadData(); // Reload to ensure consistency
    } catch (error) {
      // Rollback on error
      setUserRoles(userRoles);
      toast.error('Erro ao remover role', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
      setRemoveConfirmOpen(false);
    }
    setRoleToRemove(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Roles do Usuário</h2>
        <div className="flex gap-2">
          <Select
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            disabled={assigning || availableRoles.length === 0}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.length === 0 ? (
                <SelectItem value="" disabled>
                  Nenhuma role disponível
                </SelectItem>
              ) : (
                availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.description && ` - ${role.description}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAssignRole}
            disabled={!selectedRoleId || assigning}
          >
            {assigning && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-2 size-4" />
            Atribuir
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma role atribuída
                  </TableCell>
                </TableRow>
              ) : (
                userRoles.map((userRole) => {
                  const role = userRole.role;
                  const isSuperUser = role.name === 'super_user';
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">{role.name}</code>
                          {isSuperUser && (
                            <Badge variant="destructive" className="text-xs">
                              SUPER USER
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.description || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {role.tenant_id || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRoleToRemove(role);
                            setRemoveConfirmOpen(true);
                          }}
                          aria-label={`Remover role ${role.name}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmModal
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title="Remover Role"
        description={
          roleToRemove?.name === 'super_user'
            ? `Tem certeza que deseja remover a role "${roleToRemove.name}"? Esta é uma role crítica e sua remoção pode afetar o acesso do usuário.`
            : `Tem certeza que deseja remover a role "${roleToRemove?.name}"?`
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
        requireConfirmation={roleToRemove?.name === 'super_user'}
        confirmationText="REMOVER SUPER_USER"
        onConfirm={handleRemoveRole}
      />
    </div>
  );
}
