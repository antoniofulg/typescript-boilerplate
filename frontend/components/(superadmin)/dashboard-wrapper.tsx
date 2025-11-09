'use client';

import { DashboardHeader } from './dashboard-header';
import { StatsCards } from './stats-cards';
import { TenantsManagement } from './tenants-management';
import { DashboardErrorBoundary } from './dashboard-error-boundary';
import type { Tenant } from '@/types/tenant';

type DashboardWrapperProps = {
  tenants: Tenant[];
};

export function DashboardWrapper({ tenants }: DashboardWrapperProps) {
  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <StatsCards tenants={tenants} />
          <TenantsManagement initialTenants={tenants} />
        </main>
      </div>
    </DashboardErrorBoundary>
  );
}
