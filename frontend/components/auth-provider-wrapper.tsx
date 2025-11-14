import { getAuthenticatedUser, getAuthToken } from '@/lib/auth-server';
import { AuthProvider } from '@/lib/auth-context';

export async function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user and token on server-side
  const [user, token] = await Promise.all([
    getAuthenticatedUser(),
    getAuthToken(),
  ]);

  return (
    <AuthProvider initialUser={user} initialToken={token}>
      {children}
    </AuthProvider>
  );
}
