'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Building2,
} from 'lucide-react';
import { UserMenu } from '@/components/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  users?: number;
  sessions?: number;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Dashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return; // Aguardar carregamento da autenticação
    }

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (user && user.role !== 'SUPER_ADMIN') {
      // Redirecionar usuários não-SUPER_ADMIN para a página inicial
      // Usar replace para evitar adicionar ao histórico e criar loop
      router.replace('/');
      return;
    }

    if (
      isAuthenticated &&
      user?.role === 'SUPER_ADMIN' &&
      token &&
      !hasFetched
    ) {
      setHasFetched(true);
      void fetchTenants().catch((err) => {
        console.error('Error fetching tenants:', err);
        setError('Erro ao carregar tenants');
        setHasFetched(false); // Permitir tentar novamente
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user, router, token, hasFetched]);

  const fetchTenants = async () => {
    if (!token) {
      console.error('[Dashboard] Token não disponível para buscar tenants');
      setError('Token de autenticação não encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[Dashboard] Buscando lista de tenants...');
      const response = await fetch(`${BACKEND_URL}/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[Dashboard] Sessão expirada (401)');
          setError('Sessão expirada. Redirecionando para login...');
          setTimeout(() => {
            router.replace('/auth');
          }, 2000);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '[Dashboard] Erro ao buscar tenants:',
          response.status,
          errorData,
        );
        throw new Error(
          errorData.message ||
            `Erro ${response.status}: Falha ao buscar tenants`,
        );
      }

      const data = await response.json();
      console.log('[Dashboard] Tenants carregados com sucesso:', {
        count: data.length,
        tenants: data,
      });
      setTenants(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[Dashboard] Erro ao buscar tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTenant(null);
    setFormData({ name: '', slug: '', status: 'ACTIVE' });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      console.log('[Dashboard] Deletando tenant...', { id });
      const response = await fetch(`${BACKEND_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '[Dashboard] Erro ao deletar tenant:',
          response.status,
          errorData,
        );
        throw new Error(errorData.message || 'Falha ao deletar tenant');
      }

      console.log('[Dashboard] Tenant deletado com sucesso:', { id });
      void fetchTenants().catch((err) => {
        console.error('[Dashboard] Erro ao atualizar lista de tenants:', err);
        setError('Erro ao atualizar lista de tenants');
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao deletar tenant';
      console.error('[Dashboard] Erro ao deletar tenant:', err);
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingTenant
        ? `${BACKEND_URL}/tenants/${editingTenant.id}`
        : `${BACKEND_URL}/tenants`;
      const method = editingTenant ? 'PATCH' : 'POST';
      const body = editingTenant
        ? { name: formData.name, slug: formData.slug, status: formData.status }
        : { name: formData.name, slug: formData.slug };

      console.log('[Dashboard] Salvando tenant...', {
        method,
        url,
        body,
        isEditing: !!editingTenant,
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(
          '[Dashboard] Erro ao salvar tenant:',
          response.status,
          error,
        );
        throw new Error(error.message || 'Erro ao salvar tenant');
      }

      const data = await response.json();
      console.log('[Dashboard] Tenant salvo com sucesso:', data);
      setDialogOpen(false);
      void fetchTenants().catch((err) => {
        console.error('[Dashboard] Erro ao atualizar lista de tenants:', err);
        setError('Erro ao atualizar lista de tenants');
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao salvar tenant',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'INACTIVE':
        return 'Inativo';
      case 'SUSPENDED':
        return 'Suspenso';
      default:
        return status;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4 text-muted-foreground">
          Verificando autenticação...
        </p>
      </div>
    );
  }

  // Não renderizar nada enquanto redireciona para evitar flash de conteúdo e loop
  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Dashboard - Super Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Tenants
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tenants Ativos
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => t.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tenants Inativos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => t.status !== 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gerenciar Tenants</CardTitle>
                <CardDescription>
                  Crie, edite e gerencie os tenants do sistema
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Tenant
                  </Button>
                </DialogTrigger>
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
                            onValueChange={(
                              value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                            ) => setFormData({ ...formData, status: value })}
                            disabled={submitting}
                          >
                            <SelectTrigger id="status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Ativo</SelectItem>
                              <SelectItem value="INACTIVE">Inativo</SelectItem>
                              <SelectItem value="SUSPENDED">
                                Suspenso
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {formError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Erro</AlertTitle>
                          <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingTenant ? 'Salvar' : 'Criar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">
                  Carregando tenants...
                </p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {tenant.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tenant.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(tenant.status)}>
                          {getStatusLabel(tenant.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o tenant{' '}
                                  <strong>{tenant.name}</strong>? Esta ação não
                                  pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(tenant.id)}
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
