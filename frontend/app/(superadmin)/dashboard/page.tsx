import { redirect } from 'next/navigation';
import { getTenants } from '@/lib/api-server';
import type { Tenant, TenantStatus } from '@/types/tenant';
import { DashboardWrapper } from '@/components/(superadmin)/dashboard-wrapper';

type DashboardPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
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

  // Parse filters from searchParams
  const params = await searchParams;
  const searchQuery = typeof params.search === 'string' ? params.search : '';
  const statusFilter =
    typeof params.status === 'string' &&
    ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ALL'].includes(params.status)
      ? (params.status as TenantStatus | 'ALL')
      : 'ALL';
  const page =
    typeof params.page === 'string' ? parseInt(params.page, 10) || 1 : 1;

  // Filter tenants on server
  let filteredTenants = tenants;
  if (searchQuery) {
    filteredTenants = filteredTenants.filter(
      (tenant) =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }
  if (statusFilter !== 'ALL') {
    filteredTenants = filteredTenants.filter(
      (tenant) => tenant.status === statusFilter,
    );
  }

  return (
    <DashboardWrapper
      tenants={filteredTenants}
      allTenants={tenants}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      currentPage={page}
    />
  );
}
