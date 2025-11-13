import { redirect } from 'next/navigation';
import { getUsers, getTenants } from '@/lib/api-server';
import type { User } from '@/types/user';
import type { Tenant } from '@/types/tenant';
import { UsersManagement } from '@/components/(superadmin)/users-management';
import { DashboardErrorBoundary } from '@/components/(superadmin)/dashboard-error-boundary';

type UsersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
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

  // Parse filters from searchParams
  const params = await searchParams;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const page =
    typeof params.page === 'string' ? parseInt(params.page, 10) || 1 : 1;

  // Filter users on server
  let filteredUsers = users;
  if (searchQuery) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.tenant?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <UsersManagement
          initialUsers={filteredUsers}
          tenants={tenants}
          searchQuery={searchQuery}
          currentPage={page}
        />
      </div>
    </DashboardErrorBoundary>
  );
}
