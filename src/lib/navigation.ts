import { User } from '@/types/auth';
import { NavSection } from '@/types/navigation';

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    sectionTitle: 'OVERVIEW',
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
        title: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['operator', 'hr'], // for Niranjan default
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
    sectionTitle: 'HUMAN RESOURCES',
    items: [
      {
        title: 'Employees',
        href: '/employees',
        iconName: 'Users',
        roles: ['admin', 'manager', 'hr'],
        assignments: ['hr'],
      },
      {
        title: 'Attendance',
        href: '/attendance',
        iconName: 'CalendarCheck',
        roles: ['admin', 'manager', 'hr'],
        assignments: ['hr'],
      },
      {
        title: 'Leave',
        href: '/leave',
        iconName: 'Activity',
        roles: ['admin', 'manager', 'hr'],
        assignments: ['hr'],
      },
      {
        title: 'Overtime',
        href: '/overtime',
        iconName: 'Activity',
        roles: ['admin', 'manager', 'hr'],
        assignments: ['hr'],
      }
    ]
  },
  {
    sectionTitle: 'PRODUCTION',
    items: [
      {
        title: 'Production Line',
        href: '/production',
        iconName: 'Factory',
        roles: ['admin', 'manager', 'operator'],
        assignments: ['production'],
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
        title: 'Inventory',
        href: '/store/inventory',
        iconName: 'Package',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Goods Received',
        href: '/store/goods-received',
        iconName: 'Package',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Dispatch',
        href: '/store/dispatch',
        iconName: 'Truck',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Returns / Damaged',
        href: '/store/returns',
        iconName: 'Activity',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Low Stock',
        href: '/store/low-stock',
        iconName: 'Activity',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      },
      {
        title: 'Store Reports',
        href: '/store/reports',
        iconName: 'BarChart3',
        roles: ['admin', 'manager', 'store_manager'],
        assignments: ['store'],
      }
    ]
  },
  {
    sectionTitle: 'DISTRIBUTOR',
    items: [
      {
        title: 'Dashboard',
        href: '/distributor/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['distributor'],
      },
      {
        title: 'Products',
        href: '/distributor/products',
        iconName: 'Package',
        roles: ['distributor'],
      },
      {
        title: 'Orders',
        href: '/distributor/orders',
        iconName: 'Activity',
        roles: ['distributor'],
      },
      {
        title: 'Stock',
        href: '/distributor/stock',
        iconName: 'Package',
        roles: ['distributor'],
      },
      {
        title: 'Sales',
        href: '/distributor/sales',
        iconName: 'Receipt',
        roles: ['distributor'],
      },
      {
        title: 'Invoices & Payments',
        href: '/distributor/invoices',
        iconName: 'Receipt',
        roles: ['distributor'],
      }
    ]
  },
  {
    sectionTitle: 'FINANCE & ACCOUNTING',
    items: [
      {
        title: 'Accountant Dash',
        href: '/accountant/dashboard',
        iconName: 'LayoutDashboard',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Payroll',
        href: '/accountant/payroll',
        iconName: 'Users',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Payments',
        href: '/accountant/payments',
        iconName: 'Receipt',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Expenses',
        href: '/accountant/expenses',
        iconName: 'Receipt',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Outstanding',
        href: '/accountant/outstanding',
        iconName: 'Activity',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
      },
      {
        title: 'Financial Reports',
        href: '/accountant/reports',
        iconName: 'BarChart3',
        roles: ['admin', 'accountant'],
        assignments: ['finance'],
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
