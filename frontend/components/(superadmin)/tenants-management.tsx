'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Tenant, CreateTenantDto, UpdateTenantDto } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { TenantsTable } from './tenants-table';
import { TenantFormDialog } from './tenant-form-dialog';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';

interface TenantsManagementProps {
  initialTenants: Tenant[];
}

export function TenantsManagement({ initialTenants }: TenantsManagementProps) {
  const { token } = useAuth();
  const { loading, error, get, post, patch, delete: del } = useApi(token);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    await del(`/tenants/${id}`, {
      onSuccess: () => {
        void fetchTenants();
      },
      onError: () => {
        // Error is handled by useApi
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
            setDialogOpen(false);
            void fetchTenants();
          },
          onError: (err) => {
            setFormError(err.message);
          },
        });
      } else {
        await post('/tenants', data, {
          onSuccess: () => {
            setDialogOpen(false);
            void fetchTenants();
          },
          onError: (err) => {
            setFormError(err.message);
          },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

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

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Carregando tenants...</p>
          </div>
        )}

        {!loading && tenants.length === 0 && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum tenant encontrado. Crie o primeiro tenant!
            </p>
          </div>
        )}

        {!loading && tenants.length > 0 && (
          <TenantsTable
            tenants={tenants}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
    </Card>
  );
}
