'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Tenant, CreateTenantDto, UpdateTenantDto } from '@/types/tenant';

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  onSubmit: (data: CreateTenantDto | UpdateTenantDto) => Promise<void>;
  submitting: boolean;
  error: string | null;
  trigger?: React.ReactNode;
}

export function TenantFormDialog({
  open,
  onOpenChange,
  editingTenant,
  onSubmit,
  submitting,
  error,
  trigger,
}: TenantFormDialogProps) {
  const getInitialFormData = () => {
    if (editingTenant) {
      return {
        name: editingTenant.name,
        slug: editingTenant.slug,
        status: editingTenant.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      };
    }
    return { name: '', slug: '', status: 'ACTIVE' as const };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when dialog opens/closes or editing tenant changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTenant?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      await onSubmit({
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
      });
    } else {
      await onSubmit({
        name: formData.name,
        slug: formData.slug,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? 'Editar Tenant' : 'Criar Novo Tenant'}
            </DialogTitle>
            <DialogDescription>
              {editingTenant
                ? 'Atualize as informações do tenant'
                : 'Preencha os dados para criar um novo tenant'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase(),
                  })
                }
                required
                disabled={submitting}
                pattern="^[a-z0-9-]+$"
                title="Apenas letras minúsculas, números e hífens"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens
              </p>
            </div>
            {editingTenant && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') =>
                    setFormData({ ...formData, status: value })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
