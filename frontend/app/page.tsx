'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

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

    // Para outros usuários, mostrar uma página padrão ou redirecionar
    // Por enquanto, apenas não redirecionar para evitar loop
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSkeleton className="min-h-screen" />
      </div>
    );
  }

  return null;
}
