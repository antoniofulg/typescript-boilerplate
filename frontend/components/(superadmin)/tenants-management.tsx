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
import type {
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
} from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { TenantsTable } from './tenants-table';
import { TenantFormDialog } from './tenant-form-dialog';
import { TenantsFilters } from './tenants-filters';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import {
  createTenantAction,
  updateTenantAction,
  deleteTenantAction,
} from '@/lib/data-actions';

type TenantsManagementProps = {
  initialTenants: Tenant[];
  searchQuery: string;
  statusFilter: TenantStatus | 'ALL';
  currentPage: number;
};

export function TenantsManagement({
  initialTenants,
  searchQuery,
  statusFilter,
  currentPage,
}: TenantsManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [tenants] = useState<Tenant[]>(initialTenants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const itemsPerPage = 10;

  // Sync initialTenants when they change from parent
  useEffect(() => {
    // Tenants are now managed server-side, so we just use initialTenants
  }, [initialTenants]);

  // Clear form error when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormError(null);
    }
  }, [dialogOpen]);

  const updateURL = (
    newSearchQuery: string,
    newStatusFilter: TenantStatus | 'ALL',
    newPage: number,
  ) => {
    const params = new URLSearchParams();
    if (newSearchQuery) {
      params.set('search', newSearchQuery);
    }
    if (newStatusFilter !== 'ALL') {
      params.set('status', newStatusFilter);
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
      updateURL(query, statusFilter, 1);
    });
  };

  const handleStatusFilterChange = (status: TenantStatus | 'ALL') => {
    startTransition(() => {
      updateURL(searchQuery, status, 1);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      updateURL(searchQuery, statusFilter, page);
    });
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const tenant = tenants.find((t) => t.id === id);
    const result = await deleteTenantAction(id);

    if (result.success) {
      toast.success('Tenant excluído com sucesso!', {
        description: tenant
          ? `O tenant "${tenant.name}" foi removido.`
          : undefined,
      });
      router.refresh();
    } else {
      toast.error('Erro ao excluir tenant', {
        description: result.error || 'Erro desconhecido',
      });
    }
  };

  const handleSubmit = async (data: CreateTenantDto | UpdateTenantDto) => {
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingTenant) {
        const result = await updateTenantAction(editingTenant.id, data);
        if (result.success) {
          toast.success('Tenant atualizado com sucesso!', {
            description: `O tenant "${data.name || editingTenant.name}" foi atualizado.`,
          });
          setDialogOpen(false);
          router.refresh();
        } else {
          setFormError(result.error || 'Erro ao atualizar tenant');
          toast.error('Erro ao atualizar tenant', {
            description: result.error || 'Erro desconhecido',
          });
        }
      } else {
        // When creating, data must be CreateTenantDto (name and slug are required)
        const createData: CreateTenantDto = {
          name: data.name!,
          slug: data.slug!,
        };
        const result = await createTenantAction(createData);
        if (result.success) {
          toast.success('Tenant criado com sucesso!', {
            description: `O tenant "${createData.name}" foi criado.`,
          });
          setDialogOpen(false);
          router.refresh();
        } else {
          setFormError(result.error || 'Erro ao criar tenant');
          toast.error('Erro ao criar tenant', {
            description: result.error || 'Erro desconhecido',
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Paginate filtered tenants (already filtered on server)
  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tenants.slice(startIndex, endIndex);
  }, [tenants, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(tenants.length / itemsPerPage));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Tenants</CardTitle>
            <CardDescription>
              Crie, edite e gerencie os tenants do sistema
            </CardDescription>
          </div>
          <TenantFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingTenant={editingTenant}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={formError}
            trigger={
              <Button onClick={() => setDialogOpen(true)}>Novo Tenant</Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {tenants.length > 0 && (
          <div className="mb-4 space-y-4">
            <TenantsFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
            />
            {tenants.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Mostrando {paginatedTenants.length} de {tenants.length} tenant
                  {tenants.length !== 1 ? 's' : ''}
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

        {!isPending && tenants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum tenant encontrado. Crie o primeiro tenant!
            </p>
          </div>
        )}

        {!isPending && tenants.length > 0 && (
          <>
            <TenantsTable
              tenants={paginatedTenants}
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
  );
}
