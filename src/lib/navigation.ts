import { User } from '@/types/auth';
import { NavSection } from '@/types/navigation';

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    sectionTitle: 'MAIN',
    items: [
      {
        title: 'Store Dashboard',
        href: '/store/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Foundation Showcase',
        href: '/foundation-test',
        iconName: 'Layers',
        roles: ['admin', 'manager', 'store_manager', 'accountant', 'distributor', 'operator'],
        badge: 'UI Test',
        badgeVariant: 'primary',
      }
    ]
  },
  {
    sectionTitle: 'STORE & INVENTORY',
    items: [
      {
        title: 'Store Dashboard',
        href: '/store/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Inventory Catalog',
        href: '/store/inventory',
        iconName: 'Package',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store', 'production'],
        badge: '11 Routes',
        badgeVariant: 'secondary',
      },
      {
        title: 'Stock Inward',
        href: '/store/stock-in',
        iconName: 'Package',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Stock Outward',
        href: '/store/stock-out',
        iconName: 'Package',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Goods Received (GRN)',
        href: '/store/goods-received',
        iconName: 'Package',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Store Dispatch',
        href: '/store/dispatch',
        iconName: 'Truck',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Returns & Empty Jars',
        href: '/store/returns',
        iconName: 'Package',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Damaged & Scrap',
        href: '/store/damaged',
        iconName: 'Package',
        roles: ['admin', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Low Stock Alerts',
        href: '/store/low-stock',
        iconName: 'Package',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Store Reports',
        href: '/store/reports',
        iconName: 'BarChart3',
        roles: ['admin', 'manager', 'accountant', 'store_manager'],
        assignments: ['store'],
      }
    ]
  }
];

export function getNavigationForUser(user: User | null): NavSection[] {
  if (!user) return [];

  return ALL_NAV_SECTIONS.map(section => {
    const filteredItems = section.items.filter(item => {
      if (user.role === 'admin') return true;

      if (item.roles && !item.roles.includes(user.role)) {
        return false;
      }

      if (user.role === 'manager' && item.assignments && item.assignments.length > 0) {
        if (!user.assignments || user.assignments.length === 0) return true;
        const matchesAssignment = item.assignments.some(a => user.assignments?.includes(a));
        if (!matchesAssignment) return false;
      }

      return true;
    });

    return {
      ...section,
      items: filteredItems,
    };
  }).filter(section => section.items.length > 0);
}
