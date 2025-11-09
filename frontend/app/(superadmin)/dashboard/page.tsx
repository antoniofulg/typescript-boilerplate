'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/(superadmin)/dashboard-header';
import { StatsCards } from '@/components/(superadmin)/stats-cards';
import { TenantsManagement } from '@/components/(superadmin)/tenants-management';
import { useApi } from '@/hooks/use-api';
import type { Tenant } from '@/types/tenant';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const { get } = useApi(token);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/');
      return;
    }

    if (
      isAuthenticated &&
      user?.role === 'SUPER_ADMIN' &&
      token &&
      initialLoad
    ) {
      setInitialLoad(false);
      void get<Tenant[]>('/tenants', {
        onSuccess: (data) => {
          if (data) setTenants(data);
        },
        onError: () => {
          // Error handled by component
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user, router, token, initialLoad]);

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

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <StatsCards tenants={tenants} />
        <TenantsManagement initialTenants={tenants} />
      </main>
    </div>
  );
}
