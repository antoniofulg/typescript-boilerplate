'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user';
import type { Tenant } from '@/types/tenant';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from '@/lib/validations/user';

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  submitting: boolean;
  error: string | null;
  tenants: Tenant[];
  trigger?: React.ReactNode;
};

const roleOptions = [
  { value: 'USER', label: 'Usuário' },
  { value: 'OPERATOR', label: 'Operador' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_USER', label: 'Super Admin' },
];

export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  onSubmit,
  submitting,
  error,
  tenants,
  trigger,
}: UserFormDialogProps) {
  const form = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(editingUser ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'USER',
      tenantId: undefined,
      passwordConfirmation: undefined,
    },
  });

  const selectedRole = useWatch({
    control: form.control,
    name: 'role',
  });

  // Reset form when dialog opens/closes or editing user changes
  useEffect(() => {
    if (open) {
      if (editingUser) {
        form.reset({
          name: editingUser.name,
          email: editingUser.email,
          password: undefined,
          role: editingUser.role,
          tenantId: editingUser.tenantId || undefined,
          passwordConfirmation: undefined,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          tenantId: undefined,
          passwordConfirmation: undefined,
        });
      }
    }
  }, [open, editingUser, form]);

  // Clear tenantId when role is SUPER_USER
  useEffect(() => {
    if (selectedRole === 'SUPER_USER') {
      form.setValue('tenantId', undefined);
    }
  }, [selectedRole, form]);

  const handleSubmit = async (
    data: CreateUserFormData | UpdateUserFormData,
  ) => {
    const submitData: CreateUserDto | UpdateUserDto = {
      name: data.name,
      email: data.email,
      ...(data.password && { password: data.password }),
      ...(data.role && { role: data.role }),
      ...(data.tenantId !== undefined && {
        tenantId: data.tenantId || undefined,
      }),
      ...(data.passwordConfirmation && {
        passwordConfirmation: data.passwordConfirmation,
      }),
    };

    await onSubmit(submitData);
  };

  const isSuperUser = selectedRole === 'SUPER_USER';
  const isEditingSuperUser = editingUser?.role === 'SUPER_USER';
  const requiresPasswordConfirmation =
    isSuperUser || (editingUser && isEditingSuperUser);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Atualize as informações do usuário'
                  : 'Preencha os dados para criar um novo usuário'}
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
                        placeholder="Nome do usuário"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        disabled={submitting}
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editingUser ? 'Nova Senha (opcional)' : 'Senha'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        disabled={submitting}
                        placeholder={
                          editingUser
                            ? 'Deixe em branco para manter a senha atual'
                            : 'Mínimo 6 caracteres'
                        }
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={submitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isSuperUser && (
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant (opcional)</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === 'none' ? undefined : value)
                        }
                        value={field.value || 'none'}
                        disabled={submitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem tenant</SelectItem>
                          {tenants
                            .filter((t) => t.status === 'ACTIVE')
                            .map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione um tenant para associar ao usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {requiresPasswordConfirmation && (
                <FormField
                  control={form.control}
                  name="passwordConfirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmação de Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          disabled={submitting}
                          placeholder="Digite sua senha para confirmar"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {isSuperUser
                          ? 'Confirme sua senha para criar/alterar um SUPER_USER'
                          : 'Confirme sua senha para alterar um SUPER_USER'}
                      </FormDescription>
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
