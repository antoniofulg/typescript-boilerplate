import type {
  Permission,
  UserRole,
  UserPermissionOverride,
  EffectivePermissionDetail,
  EffectivePermissions,
} from './authApiService';

/**
 * Validates permission key format: domain:action[:scope]
 * Examples: agenda:edit, agenda:edit:own, agenda:edit:any
 */
export function isValidPermissionKey(key: string): boolean {
  const regex = /^[a-z0-9_]+:[a-z0-9_]+(?::(own|any))?$/;
  return regex.test(key);
}

/**
 * Validates role name format: snake_case lowercase
 */
export function isValidRoleName(name: string): boolean {
  const regex = /^[a-z0-9_]+$/;
  return regex.test(name);
}

/**
 * Extracts domain from permission key
 */
export function getPermissionDomain(key: string): string | null {
  const match = key.match(/^([a-z0-9_]+):/);
  return match ? match[1] : null;
}

/**
 * Extracts scope from permission key (own, any, or null)
 */
export function getPermissionScope(key: string): 'own' | 'any' | null {
  if (key.endsWith(':own')) return 'own';
  if (key.endsWith(':any')) return 'any';
  return null;
}

/**
 * Formats permission key for display with scope indicator
 */
export function formatPermissionKey(key: string): string {
  const scope = getPermissionScope(key);
  if (scope === 'own') {
    return `${key.replace(/:own$/, '')} (próprio)`;
  }
  if (scope === 'any') {
    return `${key.replace(/:any$/, '')} (qualquer)`;
  }
  return key;
}

/**
 * Aggregates effective permissions from roles and user overrides
 * Algorithm:
 * 1. Collect all permissions from roles
 * 2. Apply user overrides: DENY overrides ALLOW
 * 3. If no override, use role grants (allowed if any role grants)
 */
export function aggregateEffectivePermissions(
  userRoles: UserRole[],
  rolePermissionsMap: Map<string, Permission[]>, // roleId -> permissions
  userOverrides: UserPermissionOverride[],
): EffectivePermissions {
  const allowedSet = new Set<string>();
  const deniedSet = new Set<string>();
  const detailsMap = new Map<string, EffectivePermissionDetail>();

  // Step 1: Collect permissions from roles
  const rolePermissionsMapByKey = new Map<string, Set<string>>(); // permissionKey -> roleIds

  for (const userRole of userRoles) {
    const roleId = userRole.role.id;
    const permissions = rolePermissionsMap.get(roleId) || [];

    for (const permission of permissions) {
      const key = permission.key;

      if (!rolePermissionsMapByKey.has(key)) {
        rolePermissionsMapByKey.set(key, new Set());
      }
      rolePermissionsMapByKey.get(key)!.add(roleId);

      // Initialize detail if not exists
      if (!detailsMap.has(key)) {
        detailsMap.set(key, {
          permissionKey: key,
          source: 'role',
          roleIds: [],
        });
      }

      const detail = detailsMap.get(key)!;
      if (!detail.roleIds) {
        detail.roleIds = [];
      }
      if (!detail.roleIds.includes(roleId)) {
        detail.roleIds.push(roleId);
      }
    }
  }

  // Step 2: Apply user overrides (DENY > ALLOW)
  const overrideMap = new Map<string, 'ALLOW' | 'DENY'>();
  for (const override of userOverrides) {
    overrideMap.set(override.permissionKey, override.grantType);

    // Update or create detail for override
    if (detailsMap.has(override.permissionKey)) {
      const detail = detailsMap.get(override.permissionKey)!;
      detail.source = 'user';
      detail.grantType = override.grantType;
      // Keep roleIds for reference
    } else {
      detailsMap.set(override.permissionKey, {
        permissionKey: override.permissionKey,
        source: 'user',
        grantType: override.grantType,
      });
    }
  }

  // Step 3: Determine final state for each permission
  for (const [permissionKey] of detailsMap.entries()) {
    const override = overrideMap.get(permissionKey);

    if (override === 'DENY') {
      deniedSet.add(permissionKey);
    } else if (override === 'ALLOW') {
      allowedSet.add(permissionKey);
    } else {
      // No override, check if any role grants it
      if (rolePermissionsMapByKey.has(permissionKey)) {
        allowedSet.add(permissionKey);
      }
    }
  }

  return {
    allowed: Array.from(allowedSet).sort(),
    denied: Array.from(deniedSet).sort(),
    details: Array.from(detailsMap.values()).sort((a, b) =>
      a.permissionKey.localeCompare(b.permissionKey),
    ),
  };
}

/**
 * Filters permissions by domain
 */
export function filterPermissionsByDomain(
  permissions: Permission[],
  domain: string | null,
): Permission[] {
  if (!domain) return permissions;
  return permissions.filter((p) => getPermissionDomain(p.key) === domain);
}

/**
 * Gets unique domains from permissions list
 */
export function getUniqueDomains(permissions: Permission[]): string[] {
  const domains = new Set<string>();
  for (const permission of permissions) {
    const domain = getPermissionDomain(permission.key);
    if (domain) {
      domains.add(domain);
    }
  }
  return Array.from(domains).sort();
}

/**
 * Checks if a permission is effectively allowed for a user
 */
export function isPermissionAllowed(
  permissionKey: string,
  effectivePermissions: EffectivePermissions,
): boolean {
  return effectivePermissions.allowed.includes(permissionKey);
}

/**
 * Checks if a permission is effectively denied for a user
 */
export function isPermissionDenied(
  permissionKey: string,
  effectivePermissions: EffectivePermissions,
): boolean {
  return effectivePermissions.denied.includes(permissionKey);
}

/**
 * Gets the source detail for a permission
 */
export function getPermissionDetail(
  permissionKey: string,
  effectivePermissions: EffectivePermissions,
): EffectivePermissionDetail | undefined {
  return effectivePermissions.details.find(
    (d) => d.permissionKey === permissionKey,
  );
}
