import { UserRole, Permission, ManagerAssignment } from './auth';

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  roles?: UserRole[];
  permissions?: Permission[];
  assignments?: ManagerAssignment[];
  badge?: string | number;
  badgeVariant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'success';
  children?: NavItem[];
}

export interface NavSection {
  sectionTitle?: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
