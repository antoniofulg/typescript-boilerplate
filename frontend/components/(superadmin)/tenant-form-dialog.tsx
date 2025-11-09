'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantFormData,
  type UpdateTenantFormData,
} from '@/lib/validations/tenant';

type TenantFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  onSubmit: (data: CreateTenantDto | UpdateTenantDto) => Promise<void>;
  submitting: boolean;
  error: string | null;
  trigger?: React.ReactNode;
};

export function TenantFormDialog({
  open,
  onOpenChange,
  editingTenant,
  onSubmit,
  submitting,
  error,
  trigger,
}: TenantFormDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is necessary to avoid hydration mismatch with Radix UI Dialog IDs
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const form = useForm<CreateTenantFormData | UpdateTenantFormData>({
    resolver: zodResolver(
      editingTenant ? updateTenantSchema : createTenantSchema,
    ),
    defaultValues: {
      name: '',
      slug: '',
      ...(editingTenant && { status: 'ACTIVE' }),
    },
  });

  // Reset form when dialog opens/closes or editing tenant changes
  useEffect(() => {
    if (open) {
      if (editingTenant) {
        form.reset({
          name: editingTenant.name,
          slug: editingTenant.slug,
          status:
            (editingTenant.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') ??
            'ACTIVE',
        });
      } else {
        form.reset({
          name: '',
          slug: '',
        });
      }
    }
  }, [open, editingTenant, form]);

  const handleSubmit = async (
    data: CreateTenantFormData | UpdateTenantFormData,
  ) => {
    if (editingTenant) {
      await onSubmit({
        name: data.name,
        slug: data.slug,
        status: (data as UpdateTenantFormData).status ?? 'ACTIVE',
      });
    } else {
      await onSubmit({
        name: data.name,
        slug: data.slug,
      });
    }
  };

  // Only render Dialog after mount to avoid hydration mismatch
  if (!mounted) {
    return trigger ? <>{trigger}</> : null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        disabled={submitting}
                        placeholder="Nome do tenant"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        disabled={submitting}
                        placeholder="slug-do-tenant"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase();
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Apenas letras minúsculas, números e hífens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingTenant && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? 'ACTIVE'}
                        disabled={submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Ativo</SelectItem>
                          <SelectItem value="INACTIVE">Inativo</SelectItem>
                          <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
