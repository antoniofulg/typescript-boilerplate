import { redirect } from 'next/navigation';
import { requireSuperUser } from '@/lib/auth-server';

export default async function SuperUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperUser();
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

  return <>{children}</>;
}
