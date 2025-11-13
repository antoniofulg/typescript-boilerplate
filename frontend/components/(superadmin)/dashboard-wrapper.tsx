'use client';

import { StatsCards } from './stats-cards';
import { TenantsManagement } from './tenants-management';
import { DashboardErrorBoundary } from './dashboard-error-boundary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@/types/tenant';

type DashboardWrapperProps = {
  tenants: Tenant[];
};

export function DashboardWrapper({ tenants }: DashboardWrapperProps) {
  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <StatsCards tenants={tenants} />
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciamento de Usuários
                  </CardTitle>
                  <CardDescription>
                    Gerencie todos os usuários do sistema
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/users">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
        <TenantsManagement initialTenants={tenants} />
      </div>
    </DashboardErrorBoundary>
  );
}
