import { redirect } from 'next/navigation';
import { getAuthToken, requireSuperUser } from '@/lib/auth-server';
import { RolePermissionsEditor } from '@/components/role-permissions-editor';
import { DashboardErrorBoundary } from '@/components/(superadmin)/dashboard-error-boundary';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function RolesPage() {
  let token: string | null = null;

  try {
    await requireSuperUser();
    token = await getAuthToken();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    if (errorMessage === 'UNAUTHORIZED') {
      redirect('/');
    }
    redirect('/auth');
  }

  return (
    <DashboardErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerenciar Roles e Permissões</CardTitle>
            <CardDescription>
              Visualize e edite as permissões associadas a cada role do sistema.
              Marque as permissões que cada role deve ter acesso.
            </CardDescription>
          </CardHeader>
        </Card>
        <RolePermissionsEditor token={token} />
      </div>
    </DashboardErrorBoundary>
  );
}
