import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Helper to determine user role from RBAC system
 * This maintains backward compatibility with the old role enum
 */
export async function getUserRoleFromRbac(
  prisma: PrismaService,
  userId: string,
): Promise<UserRole> {
  // Check if user has a role with slug "super-user" (case insensitive)
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        select: {
          slug: true,
        },
      },
    },
  });

  // If no roles assigned, return USER
  if (!userRoles || userRoles.length === 0) {
    return UserRole.USER;
  }

  // Check for super-user role
  const hasSuperUserRole = userRoles.some(
    (ur) => ur.role?.slug?.toLowerCase() === 'super-user',
  );

  if (hasSuperUserRole) {
    return UserRole.SUPER_USER;
  }

  // Check for admin role
  const hasAdminRole = userRoles.some(
    (ur) => ur.role?.slug?.toLowerCase() === 'admin',
  );

  if (hasAdminRole) {
    return UserRole.ADMIN;
  }

  // Check for operator role
  const hasOperatorRole = userRoles.some(
    (ur) => ur.role?.slug?.toLowerCase() === 'operator',
  );

  if (hasOperatorRole) {
    return UserRole.OPERATOR;
  }

  // Default to USER
  return UserRole.USER;
}
