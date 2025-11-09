'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type {
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatus,
} from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { TenantsTable } from './tenants-table';
import { TenantsTableSkeleton } from './tenants-table-skeleton';
import { TenantFormDialog } from './tenant-form-dialog';
import { TenantsFilters } from './tenants-filters';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

type TenantsManagementProps = {
  initialTenants: Tenant[];
};

export function TenantsManagement({ initialTenants }: TenantsManagementProps) {
  const { token } = useAuth();
  const toast = useToast();
  const { loading, error, get, post, patch, delete: del } = useApi(token);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'ALL'>('ALL');

  // Sync initialTenants when they change from parent
  useEffect(() => {
    setTenants(initialTenants);
  }, [initialTenants]);

  const fetchTenants = async () => {
    const data = await get<Tenant[]>('/tenants', {
      onSuccess: (data) => {
        if (data) {
          setTenants(data);
        }
      },
    });
    return data;
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const tenant = tenants.find((t) => t.id === id);
    await del(`/tenants/${id}`, {
      onSuccess: () => {
        toast.success('Tenant excluído com sucesso!', {
          description: tenant
            ? `O tenant "${tenant.name}" foi removido.`
            : undefined,
        });
        void fetchTenants();
      },
      onError: (err) => {
        toast.error('Erro ao excluir tenant', {
          description: err.message,
        });
      },
    });
  };

  const handleSubmit = async (data: CreateTenantDto | UpdateTenantDto) => {
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingTenant) {
        await patch(`/tenants/${editingTenant.id}`, data, {
          onSuccess: () => {
            toast.success('Tenant atualizado com sucesso!', {
              description: `O tenant "${data.name || editingTenant.name}" foi atualizado.`,
            });
            setDialogOpen(false);
            void fetchTenants();
          },
          onError: (err) => {
            setFormError(err.message);
            toast.error('Erro ao atualizar tenant', {
              description: err.message,
            });
          },
        });
      } else {
        await post('/tenants', data, {
          onSuccess: () => {
            toast.success('Tenant criado com sucesso!', {
              description: `O tenant "${data.name}" foi criado.`,
            });
            setDialogOpen(false);
            void fetchTenants();
          },
          onError: (err) => {
            setFormError(err.message);
            toast.error('Erro ao criar tenant', {
              description: err.message,
            });
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {!loading && tenants.length > 0 && (
          <div className="mb-4">
            <TenantsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        )}

        {loading && <TenantsTableSkeleton />}

        {!loading && tenants.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum tenant encontrado. Crie o primeiro tenant!
            </p>
          </div>
        )}

        {!loading && tenants.length > 0 && filteredTenants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum tenant encontrado com os filtros aplicados.
            </p>
          </div>
        )}

        {!loading && filteredTenants.length > 0 && (
          <TenantsTable
            tenants={filteredTenants}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
    </Card>
  );
}
