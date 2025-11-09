import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth-server';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperAdmin();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    if (errorMessage === 'UNAUTHORIZED') {
      redirect('/');
    }
    // Para outros erros, também redirecionar para auth
    redirect('/auth');
  }

  return <>{children}</>;
}
