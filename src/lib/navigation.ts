import { User, UserRole } from '@/types/auth';
import { NavSection } from '@/types/navigation';

export const ROLE_ROUTES: Record<UserRole, string> = {
  super_admin: '/superadmin/organizations',
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  store_manager: '/store/dashboard',
  accountant: '/accountant/dashboard',
  distributor: '/distributor/dashboard',
  supplier: '/supplier/p2p',
  employee: '/employee/dashboard',
};

export function getDashboardRoute(role: UserRole): string {
  return ROLE_ROUTES[role] || ROLE_ROUTES.admin;
}

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    sectionTitle: 'PLATFORM GOVERNANCE',
    items: [
      { title: 'Customer Organizations', href: '/superadmin/organizations', iconName: 'Building2', roles: ['super_admin'] },
    ],
  },
  {
    sectionTitle: 'OVERVIEW',
    items: [
      { title: 'Admin Dashboard', href: '/admin/dashboard', iconName: 'LayoutDashboard', roles: ['admin'] },
      { title: 'Manager Dashboard', href: '/manager/dashboard', iconName: 'Activity', roles: ['admin', 'manager'] },
      { title: 'Store Dashboard', href: '/store/dashboard', iconName: 'LayoutDashboard', roles: ['admin', 'manager', 'store_manager'] },
      { title: 'Distributor Hub', href: '/distributor/dashboard', iconName: 'LayoutDashboard', roles: ['admin', 'manager', 'distributor'] },
      { title: 'Accountant Dashboard', href: '/accountant/dashboard', iconName: 'LayoutDashboard', roles: ['admin', 'manager', 'accountant'] },
      { title: 'Employee Portal', href: '/employee/dashboard', iconName: 'LayoutDashboard', roles: ['employee'] },
    ],
  },
  {
    sectionTitle: 'ADMIN & SYSTEM',
    items: [
      { title: 'User Management', href: '/admin/users', iconName: 'Users', roles: ['admin'] },
      { title: 'Roles & Security', href: '/admin/roles', iconName: 'ShieldCheck', roles: ['admin'] },
      { title: 'Permission Matrix', href: '/admin/permissions', iconName: 'Lock', roles: ['admin'] },
      { title: 'Managers', href: '/admin/managers', iconName: 'UserCheck', roles: ['admin'] },
      { title: 'Employees', href: '/admin/employees', iconName: 'Users2', roles: ['admin'] },
    ],
  },
  {
    sectionTitle: 'OPERATIONS',
    items: [
      { title: 'Employees', href: '/manager/employees', iconName: 'Users', roles: ['manager'] },
      { title: 'Attendance & HR', href: '/attendance', iconName: 'CalendarCheck', roles: ['admin', 'manager'], assignments: ['hr', 'production'] },
      { title: 'Leave', href: '/manager/leave', iconName: 'CalendarOff', roles: ['manager'] },
      { title: 'Overtime', href: '/manager/overtime', iconName: 'Clock', roles: ['manager'] },
      { title: 'Production Line', href: '/production', iconName: 'Factory', roles: ['admin', 'manager'], assignments: ['production'] },
      { title: 'Store & Inventory', href: '/manager/store/inventory', iconName: 'Package', roles: ['admin', 'manager'], assignments: ['store', 'production'] },
      { title: 'Distribution & Dispatch', href: '/manager/distribution', iconName: 'Truck', roles: ['admin', 'manager'], assignments: ['distribution'] },
      { title: 'Reports & Analytics', href: '/manager/reports', iconName: 'BarChart3', roles: ['admin', 'manager'] },
    ],
  },
  {
    sectionTitle: 'PROCUREMENT (P2P)',
    items: [
      { title: 'P2P Command Center', href: '/admin/p2p', iconName: 'Layers', roles: ['admin', 'super_admin'] },
      { title: 'Rate Finalisation & Approval', href: '/manager/p2p', iconName: 'ShieldCheck', roles: ['manager'] },
      { title: 'Requisitions & Goods Received', href: '/store/p2p', iconName: 'PackageCheck', roles: ['store_manager'] },
      { title: 'Vendor Portal & Dispatch', href: '/supplier/p2p', iconName: 'Truck', roles: ['supplier'] },
      { title: 'Invoices & Payments (P2P)', href: '/accountant/p2p', iconName: 'CreditCard', roles: ['accountant'] },
    ],
  },
  {
    sectionTitle: 'EMPLOYEE PORTAL',
    items: [
      { title: 'My Profile', href: '/employee/profile', iconName: 'User', roles: ['employee'] },
      { title: 'My Attendance', href: '/employee/attendance', iconName: 'CalendarCheck', roles: ['employee'] },
      { title: 'My Leave', href: '/employee/leave', iconName: 'CalendarOff', roles: ['employee'] },
      { title: 'My Overtime', href: '/employee/overtime', iconName: 'Clock', roles: ['employee'] },
      { title: 'Notifications', href: '/employee/notifications', iconName: 'Bell', roles: ['employee'] },
    ],
  },
  {
    sectionTitle: 'STORE',
    items: [
      { title: 'Inventory', href: '/store/inventory', iconName: 'Package', roles: ['admin', 'store_manager'] },
      { title: 'Stock In', href: '/store/stock-in', iconName: 'PackagePlus', roles: ['admin', 'store_manager'] },
      { title: 'Goods Received', href: '/store/goods-received', iconName: 'PackageCheck', roles: ['admin', 'store_manager'] },
      { title: 'Stock Out', href: '/store/stock-out', iconName: 'PackageMinus', roles: ['admin', 'store_manager'] },
      { title: 'Dispatch', href: '/store/dispatch', iconName: 'Truck', roles: ['admin', 'store_manager'] },
      { title: 'Returns', href: '/store/returns', iconName: 'RotateCcw', roles: ['admin', 'store_manager'] },
      { title: 'Damaged Goods', href: '/store/damaged', iconName: 'AlertTriangle', roles: ['admin', 'store_manager'] },
      { title: 'Low Stock Alerts', href: '/store/low-stock', iconName: 'Bell', roles: ['admin', 'store_manager'] },
      { title: 'Reports', href: '/store/reports', iconName: 'BarChart3', roles: ['admin', 'store_manager'] },
    ],
  },
  {
    sectionTitle: 'DISTRIBUTOR',
    items: [
      { title: 'Products', href: '/distributor/products', iconName: 'Package', roles: ['admin', 'distributor'] },
      { title: 'Orders', href: '/distributor/orders', iconName: 'ShoppingCart', roles: ['admin', 'distributor'] },
      { title: 'Stock', href: '/distributor/stock', iconName: 'PackageCheck', roles: ['admin', 'distributor'] },
      { title: 'Sales', href: '/distributor/sales', iconName: 'TrendingUp', roles: ['admin', 'distributor'] },
      { title: 'Returns', href: '/distributor/returns', iconName: 'RotateCcw', roles: ['admin', 'distributor'] },
      { title: 'Invoices', href: '/distributor/invoices', iconName: 'FileText', roles: ['admin', 'distributor'] },
      { title: 'Payments', href: '/distributor/payments', iconName: 'CreditCard', roles: ['admin', 'distributor'] },
      { title: 'Outstanding', href: '/distributor/outstanding', iconName: 'AlertCircle', roles: ['admin', 'distributor'] },
    ],
  },
  {
    sectionTitle: 'ACCOUNTING',
    items: [
      { title: 'Invoices', href: '/accountant/invoices', iconName: 'FileText', roles: ['admin', 'accountant'] },
      { title: 'Payroll', href: '/accountant/payroll', iconName: 'Wallet', roles: ['admin', 'accountant'] },
      { title: 'Payments', href: '/accountant/payments', iconName: 'CreditCard', roles: ['admin', 'accountant'] },
      { title: 'Expenses', href: '/accountant/expenses', iconName: 'Receipt', roles: ['admin', 'accountant'] },
      { title: 'Deductions', href: '/accountant/deductions', iconName: 'MinusCircle', roles: ['admin', 'accountant'] },
      { title: 'Outstanding', href: '/accountant/outstanding', iconName: 'AlertCircle', roles: ['admin', 'accountant'] },
      { title: 'Reports', href: '/accountant/reports', iconName: 'BarChart3', roles: ['admin', 'accountant'] },
    ],
  },
];

export function getNavigationForUser(user: User | null): NavSection[] {
  if (!user) return [];

  // SuperAdmin is strictly confined to platform governance dashboard and sees nothing belonging to tenant admin
  if (user.role === 'super_admin') {
    return [
      {
        sectionTitle: 'PLATFORM GOVERNANCE',
        items: [
          {
            title: 'Customer Organizations',
            href: '/superadmin/organizations',
            iconName: 'Building2',
            roles: ['super_admin'],
          },
        ],
      },
    ];
  }

  return ALL_NAV_SECTIONS.map((section) => {
    const filteredItems = section.items.filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) {
        return false;
      }
      if (user.role === 'manager' && item.assignments && item.assignments.length > 0) {
        if (!user.assignments || user.assignments.length === 0) return true;
        return item.assignments.some((a) => user.assignments?.includes(a));
      }
      return true;
    }).map((item) => {
      if (user.role === 'admin') {
        let newHref = item.href;
        if (newHref === '/attendance') newHref = '/admin/attendance';
        else if (newHref === '/production') newHref = '/admin/production';
        else if (newHref === '/manager/store/inventory') newHref = '/admin/store/inventory';
        else if (newHref === '/manager/distribution') newHref = '/admin/distribution';
        else if (newHref === '/manager/reports') newHref = '/admin/reports';
        else if (newHref === '/manager/dashboard') newHref = '/admin/manager-dashboard';
        else if (newHref === '/store/dashboard') newHref = '/admin/store-dashboard';
        else if (newHref === '/distributor/dashboard') newHref = '/admin/distributor-dashboard';
        else if (newHref === '/accountant/dashboard') newHref = '/admin/accountant-dashboard';
        return { ...item, href: newHref };
      }
      if (user.role === 'manager') {
        let newHref = item.href;
        if (newHref === '/attendance') newHref = '/manager/attendance';
        else if (newHref === '/production') newHref = '/manager/production';
        else if (newHref === '/store/dashboard') newHref = '/manager/store-dashboard';
        else if (newHref === '/distributor/dashboard') newHref = '/manager/distributor-dashboard';
        else if (newHref === '/accountant/dashboard') newHref = '/manager/accountant-dashboard';
        return { ...item, href: newHref };
      }
      if (user.role === 'employee') {
        let newHref = item.href;
        if (newHref === '/attendance') newHref = '/employee/attendance';
        else if (newHref === '/leave') newHref = '/employee/leave';
        else if (newHref === '/overtime') newHref = '/employee/overtime';
        return { ...item, href: newHref };
      }
      return item;
    });
    return { ...section, items: filteredItems };
  }).filter((section) => section.items.length > 0);
}