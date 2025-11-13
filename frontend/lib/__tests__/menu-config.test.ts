import { describe, it, expect } from 'vitest';
import {
  menuItems,
  filterMenuItemsByRole,
  groupMenuItemsBySection,
  type MenuItem,
} from '../menu-config';

describe('menu-config', () => {
  describe('menuItems', () => {
    it('should have all required menu items', () => {
      expect(menuItems).toHaveLength(3);
      expect(menuItems[0].id).toBe('dashboard');
      expect(menuItems[1].id).toBe('users');
      expect(menuItems[2].id).toBe('logs');
    });

    it('should have correct structure for each menu item', () => {
      menuItems.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('allowedRoles');
        expect(typeof item.id).toBe('string');
        expect(typeof item.path).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(Array.isArray(item.allowedRoles)).toBe(true);
      });
    });

    it('should have all items accessible by SUPER_USER', () => {
      menuItems.forEach((item) => {
        expect(item.allowedRoles).toContain('SUPER_USER');
      });
    });
  });

  describe('filterMenuItemsByRole', () => {
    it('should return empty array when userRole is undefined', () => {
      const result = filterMenuItemsByRole(menuItems, undefined);
      expect(result).toEqual([]);
    });

    it('should return all items for SUPER_USER', () => {
      const result = filterMenuItemsByRole(menuItems, 'SUPER_USER');
      expect(result).toHaveLength(3);
      expect(result.map((item) => item.id)).toEqual([
        'dashboard',
        'users',
        'logs',
      ]);
    });

    it('should return empty array for ADMIN when no items allow ADMIN', () => {
      const result = filterMenuItemsByRole(menuItems, 'ADMIN');
      expect(result).toEqual([]);
    });

    it('should return empty array for OPERATOR when no items allow OPERATOR', () => {
      const result = filterMenuItemsByRole(menuItems, 'OPERATOR');
      expect(result).toEqual([]);
    });

    it('should return empty array for USER when no items allow USER', () => {
      const result = filterMenuItemsByRole(menuItems, 'USER');
      expect(result).toEqual([]);
    });

    it('should filter items correctly when some items allow multiple roles', () => {
      const customItems: MenuItem[] = [
        {
          id: 'item1',
          path: '/item1',
          label: 'Item 1',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER', 'ADMIN'],
        },
        {
          id: 'item2',
          path: '/item2',
          label: 'Item 2',
          icon: menuItems[0].icon,
          allowedRoles: ['ADMIN'],
        },
        {
          id: 'item3',
          path: '/item3',
          label: 'Item 3',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
        },
      ];

      const adminResult = filterMenuItemsByRole(customItems, 'ADMIN');
      expect(adminResult).toHaveLength(2);
      expect(adminResult.map((item) => item.id)).toEqual(['item1', 'item2']);

      const superUserResult = filterMenuItemsByRole(customItems, 'SUPER_USER');
      expect(superUserResult).toHaveLength(2);
      expect(superUserResult.map((item) => item.id)).toEqual([
        'item1',
        'item3',
      ]);
    });
  });

  describe('groupMenuItemsBySection', () => {
    it('should group items without section into default section', () => {
      const result = groupMenuItemsBySection(menuItems);
      expect(result).toHaveProperty('default');
      expect(result.default).toHaveLength(3);
    });

    it('should group items by their section property', () => {
      const customItems: MenuItem[] = [
        {
          id: 'item1',
          path: '/item1',
          label: 'Item 1',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
          section: 'section1',
        },
        {
          id: 'item2',
          path: '/item2',
          label: 'Item 2',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
          section: 'section1',
        },
        {
          id: 'item3',
          path: '/item3',
          label: 'Item 3',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
          section: 'section2',
        },
        {
          id: 'item4',
          path: '/item4',
          label: 'Item 4',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
        },
      ];

      const result = groupMenuItemsBySection(customItems);
      expect(result).toHaveProperty('section1');
      expect(result).toHaveProperty('section2');
      expect(result).toHaveProperty('default');
      expect(result.section1).toHaveLength(2);
      expect(result.section2).toHaveLength(1);
      expect(result.default).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = groupMenuItemsBySection([]);
      expect(result).toHaveProperty('default');
      expect(result.default).toEqual([]);
    });

    it('should preserve item order within sections', () => {
      const customItems: MenuItem[] = [
        {
          id: 'item1',
          path: '/item1',
          label: 'Item 1',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
          section: 'section1',
        },
        {
          id: 'item2',
          path: '/item2',
          label: 'Item 2',
          icon: menuItems[0].icon,
          allowedRoles: ['SUPER_USER'],
          section: 'section1',
        },
      ];

      const result = groupMenuItemsBySection(customItems);
      expect(result.section1[0].id).toBe('item1');
      expect(result.section1[1].id).toBe('item2');
    });
  });
});
