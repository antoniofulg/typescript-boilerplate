import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, FileText } from 'lucide-react';
import type { UserRole } from '@/types/user';

export type MenuItem = {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  section?: string;
};

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_USER'],
  },
  {
    id: 'users',
    path: '/users',
    label: 'Usuários',
    icon: Users,
    allowedRoles: ['SUPER_USER'],
  },
  {
    id: 'logs',
    path: '/logs',
    label: 'Logs',
    icon: FileText,
    allowedRoles: ['SUPER_USER'],
  },
];

/**
 * Filtra os itens do menu baseado no role do usuário
 */
export function filterMenuItemsByRole(
  items: MenuItem[],
  userRole: UserRole | undefined,
): MenuItem[] {
  if (!userRole) {
    return [];
  }

  return items.filter((item) => item.allowedRoles.includes(userRole));
}

/**
 * Agrupa itens do menu por seção
 */
export function groupMenuItemsBySection(
  items: MenuItem[],
): Record<string, MenuItem[]> {
  const grouped: Record<string, MenuItem[]> = {
    default: [],
  };

  items.forEach((item) => {
    const section = item.section || 'default';
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  });

  return grouped;
}
