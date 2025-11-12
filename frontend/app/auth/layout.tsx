import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth-server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const user = await getAuthenticatedUser();

  if (user) {
    // Redirect based on user role
    if (user.role === 'SUPER_USER') {
      redirect('/dashboard');
    } else {
      redirect('/');
    }
  }

  // User is not authenticated, allow access to auth page
  return <>{children}</>;
}
