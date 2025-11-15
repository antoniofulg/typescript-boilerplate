import { describe, it, expect } from 'vitest';
import {
  isValidPermissionKey,
  isValidRoleName,
  getPermissionDomain,
  getPermissionScope,
  formatPermissionKey,
  aggregateEffectivePermissions,
  filterPermissionsByDomain,
  getUniqueDomains,
  isPermissionAllowed,
  isPermissionDenied,
  getPermissionDetail,
} from '../permissionsUtils';
import type {
  Permission,
  Role,
  UserRole,
  UserPermissionOverride,
  EffectivePermissions,
} from '../authApiService';

describe('permissionsUtils', () => {
  describe('isValidPermissionKey', () => {
    it('should validate correct permission keys', () => {
      expect(isValidPermissionKey('agenda:edit')).toBe(true);
      expect(isValidPermissionKey('agenda:edit:own')).toBe(true);
      expect(isValidPermissionKey('agenda:edit:any')).toBe(true);
      expect(isValidPermissionKey('session:view')).toBe(true);
      expect(isValidPermissionKey('user:delete:own')).toBe(true);
    });

    it('should reject invalid permission keys', () => {
      expect(isValidPermissionKey('agenda')).toBe(false);
      expect(isValidPermissionKey('agenda:')).toBe(false);
      expect(isValidPermissionKey(':edit')).toBe(false);
      expect(isValidPermissionKey('agenda:edit:invalid')).toBe(false);
      expect(isValidPermissionKey('AGENDA:edit')).toBe(false);
      expect(isValidPermissionKey('agenda-edit')).toBe(false);
      expect(isValidPermissionKey('')).toBe(false);
    });
  });

  describe('isValidRoleName', () => {
    it('should validate correct role names', () => {
      expect(isValidRoleName('admin_user')).toBe(true);
      expect(isValidRoleName('super_user')).toBe(true);
      expect(isValidRoleName('role123')).toBe(true);
      expect(isValidRoleName('a')).toBe(true);
    });

    it('should reject invalid role names', () => {
      expect(isValidRoleName('Admin User')).toBe(false);
      expect(isValidRoleName('admin-user')).toBe(false);
      expect(isValidRoleName('admin.user')).toBe(false);
      expect(isValidRoleName('')).toBe(false);
    });
  });

  describe('getPermissionDomain', () => {
    it('should extract domain from permission key', () => {
      expect(getPermissionDomain('agenda:edit')).toBe('agenda');
      expect(getPermissionDomain('session:view:own')).toBe('session');
      expect(getPermissionDomain('user:delete')).toBe('user');
    });

    it('should return null for invalid keys', () => {
      expect(getPermissionDomain('invalid')).toBe(null);
      expect(getPermissionDomain('')).toBe(null);
    });
  });

  describe('getPermissionScope', () => {
    it('should extract scope from permission key', () => {
      expect(getPermissionScope('agenda:edit:own')).toBe('own');
      expect(getPermissionScope('session:view:any')).toBe('any');
      expect(getPermissionScope('agenda:edit')).toBe(null);
      expect(getPermissionScope('user:delete')).toBe(null);
    });
  });

  describe('formatPermissionKey', () => {
    it('should format permission key with scope indicator', () => {
      expect(formatPermissionKey('agenda:edit:own')).toBe(
        'agenda:edit (próprio)',
      );
      expect(formatPermissionKey('session:view:any')).toBe(
        'session:view (qualquer)',
      );
      expect(formatPermissionKey('agenda:edit')).toBe('agenda:edit');
    });
  });

  describe('filterPermissionsByDomain', () => {
    const permissions: Permission[] = [
      { id: '1', key: 'agenda:edit' },
      { id: '2', key: 'agenda:view' },
      { id: '3', key: 'session:edit' },
      { id: '4', key: 'user:delete' },
    ];

    it('should filter permissions by domain', () => {
      const filtered = filterPermissionsByDomain(permissions, 'agenda');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((p) => p.key)).toEqual([
        'agenda:edit',
        'agenda:view',
      ]);
    });

    it('should return all permissions when domain is null', () => {
      const filtered = filterPermissionsByDomain(permissions, null);
      expect(filtered).toHaveLength(4);
    });
  });

  describe('getUniqueDomains', () => {
    it('should return unique domains sorted', () => {
      const permissions: Permission[] = [
        { id: '1', key: 'agenda:edit' },
        { id: '2', key: 'session:view' },
        { id: '3', key: 'agenda:delete' },
        { id: '4', key: 'user:edit' },
      ];

      const domains = getUniqueDomains(permissions);
      expect(domains).toEqual(['agenda', 'session', 'user']);
    });
  });

  describe('aggregateEffectivePermissions', () => {
    const role1: Role = { id: 'role1', name: 'admin' };
    const role2: Role = { id: 'role2', name: 'editor' };
    const userRoles: UserRole[] = [{ role: role1 }, { role: role2 }];

    const perm1: Permission = { id: 'p1', key: 'agenda:edit' };
    const perm2: Permission = { id: 'p2', key: 'session:view' };
    const perm3: Permission = { id: 'p3', key: 'user:delete' };

    it('should aggregate permissions from roles', () => {
      const rolePermissionsMap = new Map<string, Permission[]>([
        ['role1', [perm1, perm2]],
        ['role2', [perm3]],
      ]);

      const result = aggregateEffectivePermissions(
        userRoles,
        rolePermissionsMap,
        [],
      );

      expect(result.allowed).toContain('agenda:edit');
      expect(result.allowed).toContain('session:view');
      expect(result.allowed).toContain('user:delete');
      expect(result.denied).toHaveLength(0);
    });

    it('should apply DENY override', () => {
      const rolePermissionsMap = new Map<string, Permission[]>([
        ['role1', [perm1]],
      ]);

      const overrides: UserPermissionOverride[] = [
        { permissionKey: 'agenda:edit', grantType: 'DENY' },
      ];

      const result = aggregateEffectivePermissions(
        userRoles,
        rolePermissionsMap,
        overrides,
      );

      expect(result.denied).toContain('agenda:edit');
      expect(result.allowed).not.toContain('agenda:edit');
    });

    it('should apply ALLOW override', () => {
      const rolePermissionsMap = new Map<string, Permission[]>([]);

      const overrides: UserPermissionOverride[] = [
        { permissionKey: 'agenda:edit', grantType: 'ALLOW' },
      ];

      const result = aggregateEffectivePermissions(
        userRoles,
        rolePermissionsMap,
        overrides,
      );

      expect(result.allowed).toContain('agenda:edit');
    });

    it('should prioritize DENY over ALLOW', () => {
      const rolePermissionsMap = new Map<string, Permission[]>([
        ['role1', [perm1]],
      ]);

      const overrides: UserPermissionOverride[] = [
        { permissionKey: 'agenda:edit', grantType: 'ALLOW' },
        { permissionKey: 'agenda:edit', grantType: 'DENY' },
      ];

      const result = aggregateEffectivePermissions(
        userRoles,
        rolePermissionsMap,
        overrides,
      );

      // Last override wins (DENY)
      expect(result.denied).toContain('agenda:edit');
      expect(result.allowed).not.toContain('agenda:edit');
    });

    it('should include details with source information', () => {
      const rolePermissionsMap = new Map<string, Permission[]>([
        ['role1', [perm1]],
      ]);

      const result = aggregateEffectivePermissions(
        userRoles,
        rolePermissionsMap,
        [],
      );

      const detail = result.details.find(
        (d) => d.permissionKey === 'agenda:edit',
      );
      expect(detail).toBeDefined();
      expect(detail?.source).toBe('role');
      expect(detail?.roleIds).toContain('role1');
    });
  });

  describe('isPermissionAllowed', () => {
    const effectivePermissions: EffectivePermissions = {
      allowed: ['agenda:edit', 'session:view'],
      denied: ['user:delete'],
      details: [],
    };

    it('should return true for allowed permissions', () => {
      expect(isPermissionAllowed('agenda:edit', effectivePermissions)).toBe(
        true,
      );
    });

    it('should return false for denied permissions', () => {
      expect(isPermissionAllowed('user:delete', effectivePermissions)).toBe(
        false,
      );
    });

    it('should return false for not granted permissions', () => {
      expect(
        isPermissionAllowed('unknown:permission', effectivePermissions),
      ).toBe(false);
    });
  });

  describe('isPermissionDenied', () => {
    const effectivePermissions: EffectivePermissions = {
      allowed: ['agenda:edit'],
      denied: ['user:delete'],
      details: [],
    };

    it('should return true for denied permissions', () => {
      expect(isPermissionDenied('user:delete', effectivePermissions)).toBe(
        true,
      );
    });

    it('should return false for allowed permissions', () => {
      expect(isPermissionDenied('agenda:edit', effectivePermissions)).toBe(
        false,
      );
    });
  });

  describe('getPermissionDetail', () => {
    const effectivePermissions: EffectivePermissions = {
      allowed: ['agenda:edit'],
      denied: [],
      details: [
        {
          permissionKey: 'agenda:edit',
          source: 'role',
          roleIds: ['role1'],
        },
      ],
    };

    it('should return detail for existing permission', () => {
      const detail = getPermissionDetail('agenda:edit', effectivePermissions);
      expect(detail).toBeDefined();
      expect(detail?.source).toBe('role');
      expect(detail?.roleIds).toContain('role1');
    });

    it('should return undefined for non-existent permission', () => {
      const detail = getPermissionDetail(
        'unknown:permission',
        effectivePermissions,
      );
      expect(detail).toBeUndefined();
    });
  });
});
