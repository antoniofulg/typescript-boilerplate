'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user';
import type { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { UsersTable } from './users-table';
import { UserFormDialog } from './user-form-dialog';
import { PasswordConfirmationDialog } from './password-confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from '@/lib/data-actions';

type UsersManagementProps = {
  initialUsers: User[];
  tenants: Tenant[];
  searchQuery: string;
  currentPage: number;
};

export function UsersManagement({
  initialUsers,
  tenants,
  searchQuery,
  currentPage,
}: UsersManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [users] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogError, setPasswordDialogError] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Clear form error when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormError(null);
    }
  }, [dialogOpen]);

  const updateURL = (newSearchQuery: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearchQuery) {
      params.set('search', newSearchQuery);
    }
    if (newPage > 1) {
      params.set('page', String(newPage));
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleSearchChange = (query: string) => {
    startTransition(() => {
      updateURL(query, 1);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      updateURL(searchQuery, page);
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);

    if (user?.role === 'SUPER_USER') {
      setPendingDeleteId(id);
      setPasswordDialogError(null);
      setPasswordDialogOpen(true);
      return;
    }

    const result = await deleteUserAction(id);

    if (result.success) {
      toast.success('Usuário excluído com sucesso!', {
        description: user
          ? `O usuário "${user.name}" foi removido.`
          : undefined,
      });
      router.refresh();
    } else {
      toast.error('Erro ao excluir usuário', {
        description: result.error || 'Erro desconhecido',
      });
    }
  };

  const handlePasswordConfirmForDelete = async (password: string) => {
    if (!pendingDeleteId) return;

    setPasswordDialogError(null);

    const result = await deleteUserAction(pendingDeleteId, password);

    if (result.success) {
      const user = users.find((u) => u.id === pendingDeleteId);
      toast.success('Usuário excluído com sucesso!', {
        description: user
          ? `O usuário "${user.name}" foi removido.`
          : undefined,
      });
      setPasswordDialogOpen(false);
      setPendingDeleteId(null);
      router.refresh();
    } else {
      setPasswordDialogError(result.error || 'Erro ao excluir usuário');
    }
  };

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        const result = await updateUserAction(editingUser.id, data);
        if (result.success) {
          toast.success('Usuário atualizado com sucesso!', {
            description: `O usuário "${data.name || editingUser.name}" foi atualizado.`,
          });
          setDialogOpen(false);
          router.refresh();
        } else {
          setFormError(result.error || 'Erro ao atualizar usuário');
          toast.error('Erro ao atualizar usuário', {
            description: result.error || 'Erro desconhecido',
          });
        }
      } else {
        // When creating, data must be CreateUserDto (name, email, password, role are required)
        const createData: CreateUserDto = {
          name: data.name!,
          email: data.email!,
          password: data.password!,
          role: data.role!,
          tenantId: data.tenantId,
          passwordConfirmation: data.passwordConfirmation,
        };
        const result = await createUserAction(createData);
        if (result.success) {
          toast.success('Usuário criado com sucesso!', {
            description: `O usuário "${createData.name}" foi criado.`,
          });
          setDialogOpen(false);
          router.refresh();
        } else {
          setFormError(result.error || 'Erro ao criar usuário');
          toast.error('Erro ao criar usuário', {
            description: result.error || 'Erro desconhecido',
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Paginate filtered users (already filtered on server)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Crie, edite e gerencie os usuários do sistema
              </CardDescription>
            </div>
            <UserFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              editingUser={editingUser}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={formError}
              tenants={tenants}
              trigger={
                <Button onClick={() => setDialogOpen(true)}>
                  Novo Usuário
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {users.length > 0 && (
            <div className="mb-4 space-y-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, email ou tenant..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => handleSearchChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {users.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Mostrando {paginatedUsers.length} de {users.length} usuário
                    {users.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {isPending && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          )}

          {!isPending && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum usuário encontrado. Crie o primeiro usuário!
              </p>
            </div>
          )}

          {!isPending && users.length > 0 && (
            <>
              <UsersTable
                users={paginatedUsers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PasswordConfirmationDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={handlePasswordConfirmForDelete}
        title="Confirmar Exclusão de SUPER_USER"
        description="Para excluir um SUPER_USER, é necessário confirmar sua senha."
        error={passwordDialogError}
      />
    </>
  );
}
