import { redirect } from 'next/navigation';
import { getAuthToken, requireSuperUser } from '@/lib/auth-server';
import { PermissionsList } from '@/components/permissions-list';
import { DashboardErrorBoundary } from '@/components/(superadmin)/dashboard-error-boundary';

export default async function PermissionsPage() {
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
        <PermissionsList token={token} />
      </div>
    </DashboardErrorBoundary>
  );
}
