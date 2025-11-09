import { redirect } from 'next/navigation';
import { getTenants } from '@/lib/api-server';
import type { Tenant } from '@/types/tenant';
import { DashboardHeader } from '@/components/(superadmin)/dashboard-header';
import { StatsCards } from '@/components/(superadmin)/stats-cards';
import { TenantsManagement } from '@/components/(superadmin)/tenants-management';

export default async function DashboardPage() {
  let tenants: Tenant[] = [];
  try {
    tenants = await getTenants();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    // Para outros erros, retornar array vazio e deixar o componente client-side lidar
    tenants = [];
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
