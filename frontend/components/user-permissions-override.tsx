'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// Input removed - not used
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmModal } from './confirm-modal';
import type {
  Permission,
  UserPermissionOverride,
  CreateUserPermissionOverrideDto,
} from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';
import {
  isValidPermissionKey,
  formatPermissionKey,
  getPermissionScope,
} from '@/lib/permissionsUtils';

const createOverrideSchema = z.object({
  permissionKey: z
    .string()
    .min(1, 'Chave de permissão é obrigatória')
    .refine(
      (val) => isValidPermissionKey(val),
      'Formato inválido. Use: domain:action ou domain:action:scope',
    ),
  grantType: z.enum(['ALLOW', 'DENY']),
});

type UserPermissionsOverrideProps = {
  token: string | null;
  userId: string;
};

export function UserPermissionsOverride({
  token,
  userId,
}: UserPermissionsOverrideProps) {
  const [mounted, setMounted] = useState(false);
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [overrideToDelete, setOverrideToDelete] =
    useState<UserPermissionOverride | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      const [overridesData, permissionsData] = await Promise.all([
        apiService.getUserPermissionOverrides(userId),
        apiService.getPermissions(),
      ]);

      setOverrides(overridesData);
      setPermissions(permissionsData);
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

  const form = useForm<z.infer<typeof createOverrideSchema>>({
    resolver: zodResolver(createOverrideSchema),
    defaultValues: {
      permissionKey: '',
      grantType: 'ALLOW',
    },
  });

  useEffect(() => {
    if (dialogOpen) {
      form.reset({
        permissionKey: '',
        grantType: 'ALLOW',
      });
    }
  }, [dialogOpen, form]);

  const availablePermissions = useMemo(() => {
    const overrideKeys = new Set(overrides.map((o) => o.permissionKey));
    return permissions.filter((p) => !overrideKeys.has(p.key));
  }, [permissions, overrides]);

  const handleSubmit = async (data: z.infer<typeof createOverrideSchema>) => {
    setSubmitting(true);
    try {
      const payload: CreateUserPermissionOverrideDto = {
        permissionKey: data.permissionKey,
        grantType: data.grantType,
      };

      // Optimistic update
      const optimisticOverrides = [...overrides, payload];
      setOverrides(optimisticOverrides);
      setDialogOpen(false);

      await apiService.createUserPermissionOverride(userId, payload);
      toast.success('Override criado com sucesso');
      await loadData(); // Reload to ensure consistency
    } catch (error) {
      // Rollback on error
      setOverrides(overrides);
      toast.error('Erro ao criar override', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!overrideToDelete) return;

    const permissionKey = overrideToDelete.permissionKey;
    // Optimistic update
    const optimisticOverrides = overrides.filter(
      (o) => o.permissionKey !== permissionKey,
    );
    setOverrides(optimisticOverrides);
    setDeleteConfirmOpen(false);

    try {
      await apiService.deleteUserPermissionOverride(userId, permissionKey);
      toast.success('Override removido com sucesso');
      await loadData(); // Reload to ensure consistency
    } catch (error) {
      // Rollback on error
      setOverrides(overrides);
      toast.error('Erro ao remover override', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
      setDeleteConfirmOpen(false);
    }
    setOverrideToDelete(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Overrides de Permissões</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Novo Override
        </Button>
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
                <TableHead>Chave de Permissão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum override encontrado
                  </TableCell>
                </TableRow>
              ) : (
                overrides.map((override) => {
                  const scope = getPermissionScope(override.permissionKey);
                  return (
                    <TableRow key={override.permissionKey}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">
                            {override.permissionKey}
                          </code>
                          {scope && (
                            <span className="text-xs text-muted-foreground">
                              ({scope === 'own' ? 'próprio' : 'qualquer'})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            override.grantType === 'ALLOW'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {override.grantType === 'ALLOW'
                            ? 'PERMITIR'
                            : 'NEGAR'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setOverrideToDelete(override);
                            setDeleteConfirmOpen(true);
                          }}
                          aria-label={`Remover override ${override.permissionKey}`}
                        >
                          <Trash2 className="size-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogHeader>
                <DialogTitle>Novo Override de Permissão</DialogTitle>
                <DialogDescription>
                  Crie um override para permitir ou negar uma permissão
                  específica para este usuário. Overrides têm precedência sobre
                  permissões de roles.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="permissionKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave de Permissão</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma permissão" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePermissions.length === 0 ? (
                              <SelectItem value="" disabled>
                                Nenhuma permissão disponível
                              </SelectItem>
                            ) : (
                              availablePermissions.map((permission) => (
                                <SelectItem
                                  key={permission.id}
                                  value={permission.key}
                                >
                                  {formatPermissionKey(permission.key)}
                                  {permission.description &&
                                    ` - ${permission.description}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALLOW">Permitir</SelectItem>
                            <SelectItem value="DENY">Negar</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Criar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remover Override"
        description={`Tem certeza que deseja remover o override para "${overrideToDelete?.permissionKey}"?`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
