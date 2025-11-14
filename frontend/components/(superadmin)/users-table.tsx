'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { User } from '@/types/user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SortField = 'name' | 'email' | 'role' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

type UsersTableProps = {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
};

const roleLabels: Record<string, string> = {
  SUPER_USER: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operador',
  USER: 'Usuário',
};

const roleVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  SUPER_USER: 'destructive',
  ADMIN: 'default',
  OPERATOR: 'secondary',
  USER: 'outline',
};

export function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 size-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 size-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 size-4" />;
    }
    return <ArrowUpDown className="ml-2 size-4" />;
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
              onClick={() => handleSort('name')}
            >
              Nome
              {getSortIcon('name')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
              onClick={() => handleSort('email')}
            >
              Email
              {getSortIcon('email')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
              onClick={() => handleSort('role')}
            >
              Role
              {getSortIcon('role')}
            </Button>
          </TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3"
              onClick={() => handleSort('createdAt')}
            >
              Criado em
              {getSortIcon('createdAt')}
            </Button>
          </TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={roleVariants[user.role] || 'outline'}>
                {roleLabels[user.role] || user.role}
              </Badge>
            </TableCell>
            <TableCell>
              {user.tenant ? (
                <span className="text-sm">{user.tenant.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(user)}
                >
                  <Edit className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o usuário{' '}
                        <strong>{user.name}</strong>? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(user.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
