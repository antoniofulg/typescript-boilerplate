'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { UsersTableSkeleton } from './users-table-skeleton';
import { UserFormDialog } from './user-form-dialog';
import { PasswordConfirmationDialog } from './password-confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

type UsersManagementProps = {
  initialUsers: User[];
  tenants: Tenant[];
};

export function UsersManagement({
  initialUsers,
  tenants,
}: UsersManagementProps) {
  const { token } = useAuth();
  const toast = useToast();
  const { loading, error, get, post, patch, delete: del } = useApi(token);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogError, setPasswordDialogError] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Sync initialUsers when they change from parent
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Clear form error when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormError(null);
    }
  }, [dialogOpen]);

  const fetchUsers = async () => {
    const data = await get<User[]>('/users', {
      onSuccess: (data) => {
        if (data) {
          setUsers(data);
        }
      },
    });
    return data;
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

    await del(`/users/${id}`, {
      onSuccess: () => {
        toast.success('Usuário excluído com sucesso!', {
          description: user
            ? `O usuário "${user.name}" foi removido.`
            : undefined,
        });
        void fetchUsers();
      },
      onError: (err: Error) => {
        toast.error('Erro ao excluir usuário', {
          description: err.message,
        });
      },
    });
  };

  const handlePasswordConfirmForDelete = async (password: string) => {
    if (!pendingDeleteId) return;

    setPasswordDialogError(null);

    try {
      await del(
        `/users/${pendingDeleteId}`,
        { passwordConfirmation: password },
        {
          onSuccess: () => {
            const user = users.find((u) => u.id === pendingDeleteId);
            toast.success('Usuário excluído com sucesso!', {
              description: user
                ? `O usuário "${user.name}" foi removido.`
                : undefined,
            });
            setPasswordDialogOpen(false);
            setPendingDeleteId(null);
            void fetchUsers();
          },
          onError: (err) => {
            setPasswordDialogError(err.message);
            throw err;
          },
        },
      );
    } catch {
      // Error already handled
    }
  };

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        await patch(`/users/${editingUser.id}`, data, {
          onSuccess: () => {
            toast.success('Usuário atualizado com sucesso!', {
              description: `O usuário "${data.name || editingUser.name}" foi atualizado.`,
            });
            setDialogOpen(false);
            void fetchUsers();
          },
          onError: (err) => {
            setFormError(err.message);
            toast.error('Erro ao atualizar usuário', {
              description: err.message,
            });
          },
        });
      } else {
        await post('/users', data, {
          onSuccess: () => {
            toast.success('Usuário criado com sucesso!', {
              description: `O usuário "${data.name}" foi criado.`,
            });
            setDialogOpen(false);
            void fetchUsers();
          },
          onError: (err) => {
            setFormError(err.message);
            toast.error('Erro ao criar usuário', {
              description: err.message,
            });
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.tenant?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [users, searchQuery]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          {!loading && users.length > 0 && (
            <div className="mb-4 space-y-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, email ou tenant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Mostrando {paginatedUsers.length} de {filteredUsers.length}{' '}
                    usuário
                    {filteredUsers.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && <UsersTableSkeleton />}

          {!loading && users.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum usuário encontrado. Crie o primeiro usuário!
              </p>
            </div>
          )}

          {!loading && users.length > 0 && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum usuário encontrado com os filtros aplicados.
              </p>
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
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
                  onPageChange={setCurrentPage}
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
