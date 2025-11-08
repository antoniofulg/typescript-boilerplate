'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        const response = await fetch(`${backendUrl}/api/tenants`);
        if (!response.ok) {
          throw new Error('Falha ao buscar tenants');
        }
        const data = await response.json();
        setTenants(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao buscar tenants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-4 flex-1 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Sistema de Votação Inteligente
            </h1>
            <p className="text-muted-foreground text-lg">
              Sistema de votação e presença para câmaras de vereadores
            </p>
          </div>
          <div className="shrink-0 flex gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Autenticação</CardTitle>
            <CardDescription>
              Informações sobre sua sessão atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : isAuthenticated && user ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Autenticado</AlertTitle>
                  <AlertDescription>
                    Você está logado como {user.name}
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <p className="text-sm font-medium">{user.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Badge variant="default">{user.role}</Badge>
                  </div>
                  {user.tenant && (
                    <div className="space-y-2">
                      <Label>Tenant</Label>
                      <p className="text-sm font-medium">{user.tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.tenant.slug} ({user.tenant.status})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Não autenticado</AlertTitle>
                  <AlertDescription>
                    Você precisa fazer login para acessar as funcionalidades do
                    sistema.
                  </AlertDescription>
                </Alert>
                <Link href="/auth">
                  <Button className="w-full">Fazer Login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Integration Test - Example Data from Backend */}
        <Card>
          <CardHeader>
            <CardTitle>Integração com API</CardTitle>
            <CardDescription>
              Teste de integração com o backend - Lista de Tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  Erro ao buscar dados: {error}
                  <br />
                  <span className="text-xs">
                    Certifique-se de que o backend está rodando em{' '}
                    {process.env.NEXT_PUBLIC_BACKEND_URL ||
                      'http://localhost:4000'}
                  </span>
                </AlertDescription>
              </Alert>
            )}
            {!loading && !error && tenants.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Sem dados</AlertTitle>
                <AlertDescription>
                  Nenhum tenant encontrado.
                  <br />
                  <code className="text-xs mt-2 block bg-muted p-2 rounded">
                    cd backend && npm run prisma:seed
                  </code>
                </AlertDescription>
              </Alert>
            )}
            {!loading && !error && tenants.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Encontrados {tenants.length} tenant(s)
                  </p>
                  <Badge variant="secondary">API Conectada</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tenants.map((tenant) => (
                    <Card key={tenant.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {tenant.name}
                          </CardTitle>
                          <Badge
                            variant={
                              tenant.status === 'ACTIVE'
                                ? 'default'
                                : tenant.status === 'INACTIVE'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {tenant.status}
                          </Badge>
                        </div>
                        <CardDescription>Slug: {tenant.slug}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Criado em:{' '}
                          {new Date(tenant.createdAt).toLocaleDateString(
                            'pt-BR',
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
