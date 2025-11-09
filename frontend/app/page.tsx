'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserMenu } from '@/components/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Building2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return; // Aguardar carregamento
    }

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    // Redirecionar SUPER_ADMIN para dashboard
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    // Para outros usuários autenticados, mostrar página de boas-vindas
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSkeleton className="min-h-screen" />
      </div>
    );
  }

  // Se não está autenticado ou é SUPER_ADMIN, o useEffect já redirecionou
  // Este conteúdo só será renderizado para usuários autenticados não-SUPER_ADMIN
  if (!isAuthenticated || user?.role === 'SUPER_ADMIN') {
    return null;
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'OPERATOR':
        return 'Operador';
      case 'USER':
        return 'Usuário';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Voto Inteligente</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Bem-vindo, {user?.name || 'Usuário'}!</CardTitle>
              <CardDescription>
                Você está autenticado como {getRoleLabel(user?.role)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O sistema está em desenvolvimento. Em breve, você terá acesso às
                funcionalidades específicas do seu perfil.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
