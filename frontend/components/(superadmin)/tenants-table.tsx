'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Tenant } from '@/types/tenant';
import { TenantStatusBadge } from './tenant-status-badge';
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

type SortField = 'name' | 'slug' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

type TenantsTableProps = {
  tenants: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
};

export function TenantsTable({ tenants, onEdit, onDelete }: TenantsTableProps) {
  const [mounted, setMounted] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    // This is necessary to avoid hydration mismatch with Radix UI AlertDialog IDs
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
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

  const sortedTenants = [...tenants].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'slug':
        aValue = a.slug.toLowerCase();
        bValue = b.slug.toLowerCase();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
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

  // Only render AlertDialog after mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3 data-[state=open]:bg-accent"
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
                className="h-8 -ml-3 data-[state=open]:bg-accent"
                onClick={() => handleSort('slug')}
              >
                Slug
                {getSortIcon('slug')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3 data-[state=open]:bg-accent"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-3 data-[state=open]:bg-accent"
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
          {sortedTenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">{tenant.name}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {tenant.slug}
                </code>
              </TableCell>
              <TableCell>
                <TenantStatusBadge status={tenant.status} />
              </TableCell>
              <TableCell>
                {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(tenant)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        typeof window !== 'undefined' &&
                        window.confirm(
                          `Tem certeza que deseja excluir o tenant "${tenant.name}"? Esta ação não pode ser desfeita.`,
                        )
                      ) {
                        onDelete(tenant.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3 data-[state=open]:bg-accent"
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
              className="h-8 -ml-3 data-[state=open]:bg-accent"
              onClick={() => handleSort('slug')}
            >
              Slug
              {getSortIcon('slug')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3 data-[state=open]:bg-accent"
              onClick={() => handleSort('status')}
            >
              Status
              {getSortIcon('status')}
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 -ml-3 data-[state=open]:bg-accent"
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
        {sortedTenants.map((tenant) => (
          <TableRow key={tenant.id}>
            <TableCell className="font-medium">{tenant.name}</TableCell>
            <TableCell>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {tenant.slug}
              </code>
            </TableCell>
            <TableCell>
              <TenantStatusBadge status={tenant.status} />
            </TableCell>
            <TableCell>
              {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(tenant)}
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
                        Tem certeza que deseja excluir o tenant{' '}
                        <strong>{tenant.name}</strong>? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(tenant.id)}
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
