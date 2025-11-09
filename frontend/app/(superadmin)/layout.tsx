export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Implementar verificação de autenticação server-side
  // Por enquanto, a verificação é feita no client
  return <>{children}</>;
}
