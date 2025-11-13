import { redirect } from 'next/navigation';
import { requireSuperUser } from '@/lib/auth-server';
import { Sidebar } from '@/components/sidebar';
import { DashboardHeader } from '@/components/(superadmin)/dashboard-header';

export default async function SuperUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireSuperUser();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN';
    if (errorMessage === 'UNAUTHENTICATED') {
      redirect('/auth');
    }
    if (errorMessage === 'UNAUTHORIZED') {
      redirect('/');
    }
    // For other errors, also redirect to auth
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="min-h-[calc(100vh-73px)]">{children}</main>
      </div>
    </div>
  );
}
