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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmModal } from './confirm-modal';
import type { Role, CreateRoleDto, UpdateRoleDto } from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';
import { isValidRoleName } from '@/lib/permissionsUtils';

const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .refine(
      (val) => isValidRoleName(val),
      'Nome deve estar em snake_case (apenas letras minúsculas, números e underscore)',
    ),
  description: z.string().optional(),
  tenant_id: z.string().optional(),
});

const updateRoleSchema = createRoleSchema.partial();

type RolesListProps = {
  token: string | null;
};

export function RolesList({ token }: RolesListProps) {
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
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

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRoles();
      setRoles(data);
    } catch (error) {
      toast.error('Erro ao carregar roles', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      void loadRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token]);

  const form = useForm<
    z.infer<typeof createRoleSchema> | z.infer<typeof updateRoleSchema>
  >({
    resolver: zodResolver(
      editingRole ? updateRoleSchema : createRoleSchema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
    defaultValues: {
      name: '',
      description: '',
      tenant_id: '',
    },
  });

  useEffect(() => {
    if (dialogOpen) {
      if (editingRole) {
        form.reset({
          name: editingRole.name,
          description: editingRole.description || '',
          tenant_id: editingRole.tenant_id || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          tenant_id: '',
        });
      }
    }
  }, [dialogOpen, editingRole, form]);

  const handleSubmit = async (
    data: z.infer<typeof createRoleSchema> | z.infer<typeof updateRoleSchema>,
  ) => {
    setSubmitting(true);
    try {
      if (editingRole) {
        const payload: UpdateRoleDto = {
          name: data.name || editingRole.name,
          description: data.description,
          ...(data.tenant_id && { tenant_id: data.tenant_id }),
        };
        await apiService.updateRole(editingRole.id, payload);
        toast.success('Role atualizada com sucesso');
      } else {
        if (!data.name) {
          toast.error('Nome é obrigatório');
          return;
        }
        const payload: CreateRoleDto = {
          name: data.name,
          description: data.description,
          ...(data.tenant_id && { tenant_id: data.tenant_id }),
        };
        await apiService.createRole(payload);
        toast.success('Role criada com sucesso');
      }
      setDialogOpen(false);
      setEditingRole(null);
      await loadRoles();
    } catch (error) {
      toast.error('Erro ao salvar role', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    setSubmitting(true);
    try {
      await apiService.deleteRole(roleToDelete.id);
      toast.success('Role excluída com sucesso');
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      await loadRoles();
    } catch (error) {
      toast.error('Erro ao excluir role', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Roles</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Nova Role
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
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma role encontrada
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <code className="text-sm">{role.name}</code>
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
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRole(role);
                            setDialogOpen(true);
                          }}
                          aria-label={`Editar role ${role.name}`}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRoleToDelete(role);
                            setDeleteConfirmOpen(true);
                          }}
                          aria-label={`Excluir role ${role.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
                <DialogTitle>
                  {editingRole ? 'Editar Role' : 'Nova Role'}
                </DialogTitle>
                <DialogDescription>
                  {editingRole
                    ? 'Atualize as informações da role'
                    : 'Crie uma nova role. O nome deve estar em snake_case.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: admin_user"
                          disabled={submitting}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase();
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição opcional da role"
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant ID (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="UUID do tenant (opcional)"
                          disabled={submitting}
                          {...field}
                        />
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
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingRole(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {editingRole ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Role"
        description={`Tem certeza que deseja excluir a role "${roleToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
