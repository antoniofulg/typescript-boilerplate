'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<
    'ADMIN' | 'OPERATOR' | 'USER'
  >('USER');
  const [registerTenantId, setRegisterTenantId] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Usar replace para evitar adicionar ao histórico
      if (user.role === 'SUPER_ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await login(loginEmail, loginPassword);
      setSuccess('Login realizado com sucesso!');
      setTimeout(() => {
        // Redirecionar baseado no role
        if (data?.user?.role === 'SUPER_ADMIN') {
          router.replace('/dashboard');
        } else {
          router.replace('/');
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole,
        tenantId: registerTenantId || undefined,
      });
      setSuccess('Registro realizado com sucesso!');
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Sistema de Votação
          </CardTitle>
          <CardDescription className="text-center">
            Faça login ou registre-se para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'login' | 'register')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-role">Role</Label>
                  <Select
                    value={registerRole}
                    onValueChange={(v) =>
                      setRegisterRole(v as 'ADMIN' | 'OPERATOR' | 'USER')
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="register-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OPERATOR">Operador</SelectItem>
                      <SelectItem value="USER">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-tenant-id">
                    Tenant ID (opcional)
                  </Label>
                  <Input
                    id="register-tenant-id"
                    type="text"
                    placeholder="Deixe vazio se não tiver"
                    value={registerTenantId}
                    onChange={(e) => setRegisterTenantId(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Voltar para a página inicial
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
