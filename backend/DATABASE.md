# AquaNexus — Database Documentation

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Setup Instructions](#setup-instructions)
4. [Migration Commands](#migration-commands)
5. [Seed Commands](#seed-commands)
6. [Database Architecture](#database-architecture)
7. [Models Overview (35)](#models-overview-35)
8. [Enums Overview (23)](#enums-overview-23)
9. [Core Relationships](#core-relationships)
10. [Business Workflows](#business-workflows)
11. [RBAC Structure](#rbac-structure)
12. [Validation Rules](#validation-rules)
13. [Delete Policy](#delete-policy)

---

## Prerequisites

- **PostgreSQL** 14+ installed and running
- **Node.js** 18+
- **npm** 9+

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
PORT=5000
NODE_ENV="development"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/aquanexus?schema=public"
JWT_SECRET="your-secure-random-string"
```

> **Never** commit `.env` to source control.

## Setup Instructions

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE aquanexus;"

# 3. Copy environment file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev --name init

# 6. Seed the database
npx prisma db seed

# 7. Start the server
npm run dev
```

## Migration Commands

| Command | Purpose |
|---|---|
| `npx prisma migrate dev --name <name>` | Create and apply a new migration (development) |
| `npx prisma migrate deploy` | Apply pending migrations (production) |
| `npx prisma migrate reset` | Reset database and re-apply all migrations + seed |
| `npx prisma migrate status` | Check migration status |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma format` | Format the schema file |
| `npx prisma validate` | Validate schema syntax |
| `npx prisma studio` | Open database browser UI |

> **Do NOT** use `prisma db push` as the primary migration strategy.

## Seed Commands

```bash
npx prisma db seed
```

The seed script creates development data including:
- 5 roles (ADMIN, MANAGER, STORE_MANAGER, ACCOUNTANT, DISTRIBUTOR)
- 30 permissions covering all modules
- 5 users with role assignments (default password: `Password@123`)
- 6 departments, 5 employees
- 3 products, inventory, production, goods received
- 2 sales areas, 2 distributors
- Sample orders, dispatches, sales, returns
- Sample suppliers, invoices, payments, expenses, payroll
- Sample attendance, notifications, audit logs

---

## Database Architecture

```
Next.js (Frontend)
       ↓
Node.js + Express (Backend)
       ↓
Backend Validation
       ↓
Prisma ORM
       ↓
PostgreSQL
```

- **Single central store** inventory (no multiple warehouses)
- **UUID** primary keys everywhere
- **Decimal(12,2)** for all money fields (never Float)
- **Date** for date-only fields, **Timestamptz** for timestamps
- **snake_case** database table/column names via `@map` / `@@map`

---

## Models Overview (35)

### AUTH & ACCESS (6)

| # | Model | Table | Purpose |
|---|---|---|---|
| 1 | User | `users` | Application users |
| 2 | Role | `roles` | System roles |
| 3 | Permission | `permissions` | Granular permission codes |
| 4 | UserRole | `user_roles` | User ↔ Role (M2M) |
| 5 | RolePermission | `role_permissions` | Role ↔ Permission (M2M) |
| 6 | ManagerAssignment | `manager_assignments` | Manager area assignments |

### ORGANIZATION (5)

| # | Model | Table | Purpose |
|---|---|---|---|
| 7 | Department | `departments` | Business departments |
| 8 | Employee | `employees` | Business employees (optional user link) |
| 9 | Attendance | `attendance` | Daily attendance records |
| 10 | Leave | `leaves` | Leave requests |
| 11 | Overtime | `overtime` | Overtime records |

### PRODUCTS & PRODUCTION (2)

| # | Model | Table | Purpose |
|---|---|---|---|
| 12 | Product | `products` | Master product catalog |
| 13 | Production | `production` | Production batch records |

### INVENTORY (3)

| # | Model | Table | Purpose |
|---|---|---|---|
| 14 | Inventory | `inventory` | Current central store stock |
| 15 | StockTransaction | `stock_transactions` | Immutable stock movement history |
| 16 | GoodsReceived | `goods_received` | Production → Store receipt |

### DISTRIBUTION (4)

| # | Model | Table | Purpose |
|---|---|---|---|
| 17 | SalesArea | `sales_areas` | Geographic sales regions |
| 18 | Distributor | `distributors` | Business distributors |
| 19 | UserDistributor | `user_distributors` | User ↔ Distributor link |
| 20 | DistributorStock | `distributor_stock` | Stock held by distributors |

### ORDERS & DISPATCH (4)

| # | Model | Table | Purpose |
|---|---|---|---|
| 21 | Order | `orders` | Distributor product orders |
| 22 | OrderItem | `order_items` | Order line items |
| 23 | Dispatch | `dispatches` | Shipments to distributors |
| 24 | DispatchItem | `dispatch_items` | Dispatch line items |

### SALES & RETURNS (4)

| # | Model | Table | Purpose |
|---|---|---|---|
| 25 | Sale | `sales` | Recorded sales transactions |
| 26 | SaleItem | `sale_items` | Sale line items |
| 27 | Return | `returns` | Return requests |
| 28 | ReturnItem | `return_items` | Return line items |

### FINANCE (5)

| # | Model | Table | Purpose |
|---|---|---|---|
| 29 | Supplier | `suppliers` | External suppliers |
| 30 | Invoice | `invoices` | Distributor invoices |
| 31 | Payment | `payments` | Invoice payments |
| 32 | Expense | `expenses` | Operational expenses |
| 33 | Payroll | `payroll` | Employee payroll |

### SYSTEM (2)

| # | Model | Table | Purpose |
|---|---|---|---|
| 34 | Notification | `notifications` | In-app notifications |
| 35 | AuditLog | `audit_logs` | Immutable audit trail |

---

## Enums Overview (23)

| # | Enum | Values |
|---|---|---|
| 1 | UserStatus | ACTIVE, INACTIVE, SUSPENDED |
| 2 | ManagerArea | PRODUCTION, STORE, DISTRIBUTION |
| 3 | DepartmentStatus | ACTIVE, INACTIVE |
| 4 | EmploymentType | PERMANENT, CONTRACT, TEMPORARY, INTERN |
| 5 | EmployeeStatus | ACTIVE, INACTIVE, ON_LEAVE, TERMINATED |
| 6 | AttendanceStatus | PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY |
| 7 | LeaveType | CASUAL, SICK, ANNUAL, EMERGENCY, OTHER |
| 8 | LeaveStatus | PENDING, APPROVED, REJECTED, CANCELLED |
| 9 | OvertimeStatus | PENDING, APPROVED, REJECTED |
| 10 | ProductStatus | ACTIVE, INACTIVE, DISCONTINUED |
| 11 | ProductionStatus | PLANNED, IN_PROGRESS, COMPLETED, CANCELLED |
| 12 | TransactionType | PRODUCTION_RECEIPT, STOCK_IN, STOCK_OUT, DISPATCH, RETURN, DAMAGED, ADJUSTMENT |
| 13 | OrderStatus | PENDING, CONFIRMED, CANCELLED, DISPATCHED, DELIVERED |
| 14 | DispatchStatus | PREPARING, DISPATCHED, DELIVERED, CANCELLED |
| 15 | SaleStatus | COMPLETED, CANCELLED, RETURNED, PARTIALLY_RETURNED |
| 16 | ReturnStatus | REQUESTED, APPROVED, REJECTED, RECEIVED, CANCELLED |
| 17 | ReturnCondition | GOOD, DAMAGED |
| 18 | InvoiceStatus | DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED |
| 19 | PaymentMethod | CASH, BANK_TRANSFER, UPI, CHEQUE, OTHER |
| 20 | PaymentStatus | PENDING, COMPLETED, FAILED, CANCELLED |
| 21 | ExpenseStatus | PENDING, APPROVED, REJECTED, PAID |
| 22 | PayrollStatus | DRAFT, PROCESSED, PAID, CANCELLED |
| 23 | NotificationType | INFO, WARNING, ALERT, SUCCESS |

---

## Core Relationships

### User Hub
```
User
 ├── UserRole ──→ Role ──→ RolePermission ──→ Permission
 ├── ManagerAssignment
 ├── UserDistributor ──→ Distributor
 ├── Employee (optional, 1:1)
 ├── Notification
 └── AuditLog
```

### Employee Hub
```
Department
    ↓
Employee (userId optional, unique)
 ├── Attendance
 ├── Leave
 ├── Overtime
 └── Payroll
```

### Product Hub
```
Product
 ├── Production ──→ GoodsReceived
 ├── Inventory (1:1)
 ├── StockTransaction
 ├── OrderItem
 ├── DispatchItem
 ├── SaleItem
 ├── ReturnItem
 └── DistributorStock
```

### Distribution Hub
```
SalesArea
    ↓
Distributor
 ├── DistributorStock
 ├── Order ──→ OrderItem
 ├── Dispatch ──→ DispatchItem
 ├── Sale ──→ SaleItem
 ├── Return ──→ ReturnItem
 └── Invoice ──→ Payment
```

---

## Business Workflows

### Workflow 1: Production → Inventory
```
Production (record created, status: PLANNED → COMPLETED)
    ↓
GoodsReceived (confirms receipt into store)
    ↓
StockTransaction (type: PRODUCTION_RECEIPT, quantity > 0)
    ↓
Inventory (quantity increases)
```
> **Critical:** Creating a Production record does NOT auto-increase inventory. Only GoodsReceived triggers inventory update.

### Workflow 2: Order → Dispatch → Distributor
```
Order (status: PENDING → CONFIRMED → DISPATCHED → DELIVERED)
    ↓
Dispatch (validated against available inventory)
    ↓
StockTransaction (type: DISPATCH)
    ↓
Inventory (quantity decreases)
    ↓
DistributorStock (quantity increases)
```

### Workflow 3: Sales Flow
```
DistributorStock
    ↓
Sale ──→ SaleItem
```

### Workflow 4: Finance Flow
```
Order / Sale
    ↓
Invoice (status tracks payment progress)
    ↓
Payment (total payments ≤ invoice total)
    ↓
Outstanding = totalAmount - sum(completed payments)
```

### Workflow 5: Employee → Payroll
```
Employee
    ↓
Attendance + Overtime
    ↓
Payroll (netSalary = basicSalary + overtimeAmount - deductions)
```

---

## RBAC Structure

- Users can hold **multiple roles** via the `UserRole` join table
- Permissions are assigned to roles via `RolePermission`
- Backend middleware evaluates user roles and permissions for authorization
- `ManagerAssignment` provides domain-level authorization (PRODUCTION, STORE, DISTRIBUTION)

### Seeded Roles

| Role | Description |
|---|---|
| ADMIN | Full system access (all permissions) |
| MANAGER | Operational management |
| STORE_MANAGER | Store and inventory management |
| ACCOUNTANT | Finance and accounting |
| DISTRIBUTOR | Distributor portal access |

---

## Validation Rules

Validation occurs at **three levels**: Frontend → Backend → PostgreSQL.

### Critical Business Invariants

1. `inventory.quantity` can never be negative
2. `reservedQuantity` cannot exceed `quantity`
3. Every order must have at least one `OrderItem`
4. Dispatch quantity cannot exceed available inventory (`quantity - reservedQuantity`)
5. Return quantity cannot exceed eligible sold/dispatched quantity
6. Payment cannot exceed outstanding invoice amount
7. Invoice `dueDate` cannot be before `invoiceDate`
8. Leave `endDate` cannot be before `startDate`
9. Attendance cannot have duplicate employee/date records (`UNIQUE` constraint)
10. Payroll periods should not overlap for the same employee
11. Goods received quantity cannot exceed production quantity
12. Every stock-changing operation must create a `StockTransaction`
13. Multi-table stock operations must use **Prisma transactions**
14. `netSalary` must be calculated/validated by backend
15. Invoice totals must be calculated/validated by backend (`subtotal - discount + tax = totalAmount`)
16. Historical records must not be silently deleted

---

## Delete Policy

| Category | ON DELETE | Rationale |
|---|---|---|
| Join tables (UserRole, RolePermission, UserDistributor) | **Cascade** | No independent meaning without parent |
| OrderItem, DispatchItem, SaleItem, ReturnItem | **Cascade** on parent | Line items belong to their parent |
| StockTransaction, Payment, Invoice, AuditLog | **Restrict** | Historical records must be preserved |
| Production, Sale, Payroll | **Restrict** | Business history |
| Employee → Department | **Restrict** | Cannot delete department with employees |
| Employee → User | **SetNull** | Employee remains if user is removed |
| Notification → User | **Cascade** | Notifications are user-specific |

### Preferred Alternatives to Deletion

Use status changes instead of physical deletion:
- `INACTIVE`, `CANCELLED`, `REJECTED`, `TERMINATED`, `DISCONTINUED`
