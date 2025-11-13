import { redirect } from 'next/navigation';
import { getUsers, getTenants } from '@/lib/api-server';
import type { User } from '@/types/user';
import type { Tenant } from '@/types/tenant';
import { UsersManagement } from '@/components/(superadmin)/users-management';
import { DashboardErrorBoundary } from '@/components/(superadmin)/dashboard-error-boundary';

export default async function UsersPage() {
  let users: User[] = [];
  let tenants: Tenant[] = [];

  try {
    [users, tenants] = await Promise.all([getUsers(), getTenants()]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    // Para outros erros, retornar arrays vazios e deixar o componente client-side lidar
    users = [];
    tenants = [];
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <UsersManagement initialUsers={users} tenants={tenants} />
      </div>
    </DashboardErrorBoundary>
  );
}
