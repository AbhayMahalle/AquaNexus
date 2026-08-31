# User Roles and Permissions

This directory contains comprehensive documentation of user roles, permissions, and access control in the Aqua Nexus system.

## Contents

### Overview

Complete role and permission documentation including:

- Role definitions and responsibilities
- Permission matrix and access levels
- Feature access by role
- Area assignment for managers
- Permission scoping and data visibility
- Role-based UI rendering
- API authorization rules

### The Five Roles

1. **Admin**
   - Full system access
   - User and role management
   - System configuration
   - Audit log access

2. **Manager**
   - Team employee management
   - Operational area oversight
   - Approval authority
   - Performance reporting

3. **Store Manager**
   - Inventory and warehouse operations
   - Stock tracking
   - Order fulfillment
   - Warehouse resource management

4. **Accountant**
   - Financial transaction processing
   - Invoice and payment management
   - Expense tracking
   - Financial reporting

5. **Distributor**
   - Sales order management
   - Delivery operations
   - Customer interaction
   - Sales reporting

### Permission Model

Permission structure:
- **Resource:** What (users, employees, inventory, etc.)
- **Action:** What can be done (create, read, update, delete, approve, etc.)
- **Scope:** How much data access (own, team, area, all)

Format: `resource:action:scope`

Example: `employees:update:team`, `invoices:read:all`, `orders:delete:own`

### Role-Permission Matrix

Comprehensive matrix showing:
- Each role (rows)
- Each module (columns)
- Permissions granted (cells)

### Area Assignment for Managers

Managers can be assigned to:
- **Production** - Production scheduling and resource management
- **Store** - Inventory and warehouse operations
- **Distribution** - Delivery and logistics

Each area assignment grants specific permissions for that area only.

### Data Visibility and Scoping

Data access controlled by:
- User role and permissions
- Assigned area (for managers)
- Team/department membership
- Record ownership
- Query-level filtering

## Files to Be Added

### Core Documentation
- `role-definitions.md` - Detailed role descriptions and responsibilities
- `permission-matrix.md` - Complete permission matrix by role and module
- `permission-model.md` - Permission structure and scoping rules

### Role-Specific Documentation
- `admin-role.md` - Admin user capabilities and access
- `manager-role.md` - Manager responsibilities and area assignment
- `store-manager-role.md` - Store Manager warehouse operations
- `accountant-role.md` - Accountant financial operations
- `distributor-role.md` - Distributor sales and delivery operations

### Access Control
- `area-assignment.md` - Manager area assignment mechanism
- `permission-scoping.md` - Data visibility and filtering rules
- `role-based-ui.md` - UI rendering based on permissions
- `api-authorization.md` - API-level permission checking

### Management
- `role-management.md` - Creating and modifying roles
- `permission-management.md` - Managing permissions
- `audit-access-control.md` - Auditing role and permission changes

## Permission Categories

### User & Role Management
- `users:create`, `users:read`, `users:update`, `users:delete`
- `roles:read`, `roles:create`, `roles:update` (Admin only)

### Employee Management
- `employees:read:all`, `employees:read:team`
- `employees:update:team`, `employees:delete:own`
- `employees:approve:leave`, `employees:approve:overtime`

### Attendance & Leave
- `attendance:read:team`, `attendance:create:own`
- `leave:read:team`, `leave:create:own`, `leave:approve:team`

### Production
- `production:read:area`, `production:create:run`
- `production:update:area`

### Inventory
- `inventory:read:all`, `inventory:create:movement`
- `inventory:update:stock`, `inventory:delete:obsolete`

### Orders & Sales
- `orders:create:all`, `orders:read:assigned`
- `orders:update:status`, `orders:delete:own`

### Financial
- `invoices:create:all`, `invoices:read:all`
- `payments:process:all`, `payments:read:all`

### Reporting
- `reports:read:own`, `reports:read:team`
- `reports:read:area`, `reports:read:all`

### System
- `system:configure` (Admin only)
- `audit:read:all` (Admin, Manager)

## Role-Based Features

### Admin Features
- User management dashboard
- System configuration panel
- Audit log viewer
- Role and permission management
- Database administration tools

### Manager Features
- Employee management
- Team performance dashboard
- Leave and overtime approvals
- Area-specific operations (if assigned)
- Team-level reporting

### Store Manager Features
- Inventory dashboard
- Stock level monitoring
- Warehouse operations
- Order fulfillment tracking
- Inventory reconciliation tools

### Accountant Features
- Financial dashboard
- Invoice management
- Payment processing
- Expense management
- Financial reports and analysis

### Distributor Features
- Order management
- Delivery tracking
- Customer management
- Sales reports
- Performance metrics

## Permission Checking

### Frontend
- Components check user permissions before rendering
- Buttons/forms disabled for insufficient permissions
- Navigation restricted to accessible pages
- Error messages for permission denied

### Backend
- Middleware verifies JWT token
- RBAC middleware checks required permissions
- Repository queries filter by data access rules
- Audit logs record access attempts

## Related Documentation

- [RBAC System](../architecture/) in Architecture
- [User Roles](../../README.md#user-roles) in Main README
- [RBAC and Permission Model](../../README.md#rbac-and-permission-model) in Main README
- [Manager Assigned Areas](../../README.md#manager-assigned-areas) in Main README

## Examples

### Manager with Production Area
```
User: John Manager
Role: Manager
Assigned Areas: [Production]

Can:
- Read: All production employees, schedules, logs
- Create: Production runs
- Update: Production status (in assigned area only)
- Approve: Overtime for production team

Cannot:
- Access inventory or distribution data
- Manage other areas
- Change role assignments
```

### Store Manager
```
User: Sarah Warehouse
Role: Store Manager

Can:
- Read: All inventory, warehouse data
- Create: Stock movements, warehouse transfers
- Update: Stock levels, warehouse locations
- Delete: Obsolete items

Cannot:
- Create sales orders directly
- Process payments
- Manage employees
```

## Regular Reviews

- Audit permission usage regularly
- Review and remove unused roles
- Update permissions with business changes
- Test permission boundaries
- Document permission changes

---

**Last Updated:** August 31, 2026
**Status:** Role Foundation Defined, Detailed Permissions to Be Implemented
