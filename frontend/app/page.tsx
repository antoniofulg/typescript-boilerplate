import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth-server';
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

export default async function Home() {
  const user = await getAuthenticatedUser();

  // Redirect unauthenticated users to auth page
  if (!user) {
    redirect('/auth');
  }

  // Redirect SUPER_USER to dashboard
  if (user.role === 'SUPER_USER') {
    redirect('/dashboard');
  }

  const getRoleLabel = (role: string) => {
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
              <CardTitle>Bem-vindo, {user.name || 'Usuário'}!</CardTitle>
              <CardDescription>
                Você está autenticado como {getRoleLabel(user.role)}
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
