import { redirect } from 'next/navigation';
import { getTenants } from '@/lib/api-server';
import type { Tenant } from '@/types/tenant';
import { DashboardWrapper } from '@/components/(superadmin)/dashboard-wrapper';

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

  return <DashboardWrapper tenants={tenants} />;
}
