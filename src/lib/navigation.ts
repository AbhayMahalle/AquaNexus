import { User, UserRole } from '@/types/auth';
import { NavSection } from '@/types/navigation';

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  store_manager: '/store/dashboard',
  accountant: '/accountant/dashboard',
  distributor: '/distributor/dashboard',
  
  employee: '/employee/dashboard',
};

export function getDashboardRoute(role: UserRole): string {
  return ROLE_ROUTES[role] || ROLE_ROUTES.admin;
}

export const ALL_NAV_SECTIONS: NavSection[] = [
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
      { title: 'Inventory', href: '/store/inventory', iconName: 'Package', roles: ['store_manager'] },
      { title: 'Stock In', href: '/store/stock-in', iconName: 'PackagePlus', roles: ['store_manager'] },
      { title: 'Goods Received', href: '/store/goods-received', iconName: 'PackageCheck', roles: ['store_manager'] },
      { title: 'Stock Out', href: '/store/stock-out', iconName: 'PackageMinus', roles: ['store_manager'] },
      { title: 'Dispatch', href: '/store/dispatch', iconName: 'Truck', roles: ['store_manager'] },
      { title: 'Returns', href: '/store/returns', iconName: 'RotateCcw', roles: ['store_manager'] },
      { title: 'Damaged Goods', href: '/store/damaged', iconName: 'AlertTriangle', roles: ['store_manager'] },
      { title: 'Low Stock Alerts', href: '/store/low-stock', iconName: 'Bell', roles: ['store_manager'] },
      { title: 'Reports', href: '/store/reports', iconName: 'BarChart3', roles: ['store_manager'] },
    ],
  },
  {
    sectionTitle: 'DISTRIBUTOR',
    items: [
      { title: 'My Products', href: '/distributor/products', iconName: 'Package', roles: ['distributor'] },
      { title: 'My Orders', href: '/distributor/orders', iconName: 'ShoppingCart', roles: ['distributor'] },
      { title: 'My Stock', href: '/distributor/stock', iconName: 'PackageCheck', roles: ['distributor'] },
      { title: 'My Sales', href: '/distributor/sales', iconName: 'TrendingUp', roles: ['distributor'] },
      { title: 'Returns', href: '/distributor/returns', iconName: 'RotateCcw', roles: ['distributor'] },
      { title: 'Invoices', href: '/distributor/invoices', iconName: 'FileText', roles: ['distributor'] },
      { title: 'Payments', href: '/distributor/payments', iconName: 'CreditCard', roles: ['distributor'] },
      { title: 'Outstanding', href: '/distributor/outstanding', iconName: 'AlertCircle', roles: ['distributor'] },
    ],
  },
  {
    sectionTitle: 'ACCOUNTING',
    items: [
      { title: 'Invoices', href: '/accountant/invoices', iconName: 'FileText', roles: ['accountant'] },
      { title: 'Payroll', href: '/accountant/payroll', iconName: 'Wallet', roles: ['accountant'] },
      { title: 'Payments', href: '/accountant/payments', iconName: 'CreditCard', roles: ['accountant'] },
      { title: 'Expenses', href: '/accountant/expenses', iconName: 'Receipt', roles: ['accountant'] },
      { title: 'Deductions', href: '/accountant/deductions', iconName: 'MinusCircle', roles: ['accountant'] },
      { title: 'Outstanding', href: '/accountant/outstanding', iconName: 'AlertCircle', roles: ['accountant'] },
      { title: 'Reports', href: '/accountant/reports', iconName: 'BarChart3', roles: ['accountant'] },
    ],
  },
];

export function getNavigationForUser(user: User | null): NavSection[] {
  if (!user) return [];

  return ALL_NAV_SECTIONS.map((section) => {
    const filteredItems = section.items.filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) return false;
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