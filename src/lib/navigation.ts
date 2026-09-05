import { User } from '@/types/auth';
import { NavSection } from '@/types/navigation';

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    sectionTitle: 'MAIN',
    items: [
      {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['admin'],
      },
      {
        title: 'Manager Dashboard',
        href: '/manager/dashboard',
        iconName: 'Activity',
        roles: ['manager', 'admin'],
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
    sectionTitle: 'ADMIN & SYSTEM',
    items: [
      {
        title: 'User Management',
        href: '/admin/users',
        iconName: 'Users',
        roles: ['admin'],
      },
      {
        title: 'Roles & Security',
        href: '/admin/roles',
        iconName: 'ShieldCheck',
        roles: ['admin'],
      },
      {
        title: 'Permission Matrix',
        href: '/admin/permissions',
        iconName: 'Lock',
        roles: ['admin'],
      }
    ]
  },
  {
    sectionTitle: 'OPERATIONS',
    items: [
      {
        title: 'Attendance & HR',
        href: '/manager/attendance',
        iconName: 'CalendarCheck',
        roles: ['admin', 'manager'],
        assignments: ['hr', 'production'],
      },
      {
        title: 'Production Line',
        href: '/manager/production',
        iconName: 'Factory',
        roles: ['admin', 'manager', 'operator'],
        assignments: ['production'],
      },
      {
        title: 'Store & Inventory',
        href: '/manager/inventory',
        iconName: 'Package',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store', 'production'],
        badge: 'RAM Module',
        badgeVariant: 'secondary',
      },
      {
        title: 'Distribution & Dispatch',
        href: '/manager/distribution',
        iconName: 'Truck',
        roles: ['admin', 'manager', 'distributor'],
        assignments: ['distribution'],
      },
      {
        title: 'Financial & Sales',
        href: '/admin/dashboard',
        iconName: 'Receipt',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Reports & Analytics',
        href: '/manager/reports',
        iconName: 'BarChart3',
        roles: ['admin', 'manager', 'accountant', 'store_manager'],
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
