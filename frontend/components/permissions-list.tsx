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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmModal } from './confirm-modal';
import type { Permission } from '@/lib/authApiService';
import { AuthApiService } from '@/lib/authApiService';
import {
  isValidPermissionKey,
  filterPermissionsByDomain,
  getUniqueDomains,
  getPermissionScope,
} from '@/lib/permissionsUtils';
import { Pagination } from './ui/pagination';

const ITEMS_PER_PAGE = 10;

const createPermissionSchema = z.object({
  key: z
    .string()
    .min(1, 'Chave é obrigatória')
    .refine(
      (val) => isValidPermissionKey(val),
      'Formato inválido. Use: domain:action ou domain:action:scope (scope: own|any)',
    ),
  description: z.string().optional(),
});

const updatePermissionSchema = createPermissionSchema.partial();

type PermissionsListProps = {
  token: string | null;
};

export function PermissionsList({ token }: PermissionsListProps) {
  const [mounted, setMounted] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] =
    useState<Permission | null>(null);
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

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPermissions();
      setPermissions(data);
    } catch (error) {
      toast.error('Erro ao carregar permissões', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && token) {
      void loadPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token]);

  const form = useForm<
    | z.infer<typeof createPermissionSchema>
    | z.infer<typeof updatePermissionSchema>
  >({
    resolver: zodResolver(
      editingPermission ? updatePermissionSchema : createPermissionSchema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
    defaultValues: {
      key: '',
      description: '',
    },
  });

  useEffect(() => {
    if (dialogOpen) {
      if (editingPermission) {
        form.reset({
          key: editingPermission.key,
          description: editingPermission.description || '',
        });
      } else {
        form.reset({
          key: '',
          description: '',
        });
      }
    }
  }, [dialogOpen, editingPermission, form]);

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

  const totalPages = Math.ceil(filteredPermissions.length / ITEMS_PER_PAGE);
  const paginatedPermissions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPermissions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPermissions, currentPage]);

  const domains = useMemo(() => getUniqueDomains(permissions), [permissions]);

  const handleSubmit = async (
    data:
      | z.infer<typeof createPermissionSchema>
      | z.infer<typeof updatePermissionSchema>,
  ) => {
    setSubmitting(true);
    try {
      if (editingPermission) {
        await apiService.updatePermission(editingPermission.id, {
          key: data.key || editingPermission.key,
          description: data.description,
        });
        toast.success('Permissão atualizada com sucesso');
      } else {
        if (!data.key) {
          toast.error('Chave é obrigatória');
          return;
        }
        await apiService.createPermission({
          key: data.key,
          description: data.description,
        });
        toast.success('Permissão criada com sucesso');
      }
      setDialogOpen(false);
      setEditingPermission(null);
      await loadPermissions();
    } catch (error) {
      toast.error('Erro ao salvar permissão', {
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!permissionToDelete) return;

    setSubmitting(true);
    try {
      await apiService.deletePermission(permissionToDelete.id);
      toast.success('Permissão excluída com sucesso');
      setDeleteConfirmOpen(false);
      setPermissionToDelete(null);
      await loadPermissions();
    } catch (error) {
      toast.error('Erro ao excluir permissão', {
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
        <h2 className="text-2xl font-bold">Permissões</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Nova Permissão
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por chave ou descrição..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            aria-label="Buscar permissões"
          />
        </div>
        <Select
          value={domainFilter || 'all'}
          onValueChange={(value) => {
            setDomainFilter(value === 'all' ? null : value);
            setCurrentPage(1);
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma permissão encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPermissions.map((permission) => {
                    const scope = getPermissionScope(permission.key);
                    return (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{permission.key}</code>
                            {scope && (
                              <span
                                className="text-xs text-muted-foreground"
                                title={
                                  scope === 'own'
                                    ? 'Apenas recursos próprios'
                                    : 'Qualquer recurso'
                                }
                              >
                                ({scope === 'own' ? 'próprio' : 'qualquer'})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {permission.description || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPermission(permission);
                                setDialogOpen(true);
                              }}
                              aria-label={`Editar permissão ${permission.key}`}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPermissionToDelete(permission);
                                setDeleteConfirmOpen(true);
                              }}
                              aria-label={`Excluir permissão ${permission.key}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingPermission ? 'Editar Permissão' : 'Nova Permissão'}
                </DialogTitle>
                <DialogDescription>
                  {editingPermission
                    ? 'Atualize as informações da permissão'
                    : 'Crie uma nova permissão seguindo o formato domain:action[:scope]'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: agenda:edit:own"
                          disabled={submitting || !!editingPermission}
                          {...field}
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
                          placeholder="Descrição opcional da permissão"
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
                    setEditingPermission(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {editingPermission ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Permissão"
        description={`Tem certeza que deseja excluir a permissão "${permissionToDelete?.key}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
