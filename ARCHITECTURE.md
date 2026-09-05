# Aqua Nexus - System Architecture

This document provides a comprehensive overview of the Aqua Nexus system architecture, design patterns, and implementation structure.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Layered Architecture](#layered-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Module Organization](#module-organization)
6. [RBAC System](#rbac-system)
7. [Permission Model](#permission-model)
8. [Manager Area Assignment](#manager-area-assignment)
9. [Database Architecture](#database-architecture)
10. [Security Architecture](#security-architecture)
11. [API Architecture](#api-architecture)
12. [Data Flow](#data-flow)
13. [Deployment Architecture](#deployment-architecture)

---

## System Overview

Aqua Nexus is built as a centralized, role-based management system serving a water treatment and distribution facility. The architecture follows proven patterns for scalability, maintainability, and security.

### Architecture Principles

1. **Separation of Concerns:** Clear boundaries between layers and modules
2. **Single Responsibility:** Each component has one reason to change
3. **Scalability:** Horizontally scalable backend with stateless API
4. **Security-First:** Permissions and access control at multiple levels
5. **Auditability:** Complete tracking of all user actions
6. **Data Integrity:** ACID compliance and referential integrity
7. **Performance:** Optimized queries and indexed database design

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                  │
│  (Web UI - React)                                       │
│  ├─ UI Components                                       │
│  ├─ Pages and Layouts                                   │
│  ├─ Forms and Input Validation                          │
│  └─ State Management                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ REST API
                      │ (HTTPS/JSON)
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   API LAYER                             │
│  (Node.js/Express)                                      │
│  ├─ HTTP Route Handlers                                 │
│  ├─ Authentication Middleware                           │
│  ├─ Authorization (RBAC) Middleware                     │
│  ├─ Request Validation                                  │
│  ├─ Error Handling                                      │
│  └─ Response Formatting                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 BUSINESS LOGIC LAYER                    │
│  (Services)                                             │
│  ├─ Business Rule Enforcement                           │
│  ├─ Cross-Module Orchestration                          │
│  ├─ Complex Calculations                                │
│  ├─ Workflow Management                                 │
│  └─ Notifications                                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              DATA ACCESS LAYER                          │
│  (Repositories)                                         │
│  ├─ Database Queries                                    │
│  ├─ Query Building (Prisma ORM)                         │
│  ├─ Transaction Management                              │
│  └─ Data Caching (optional)                             │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  DATABASE LAYER                         │
│  (PostgreSQL)                                           │
│  ├─ Relational Data Storage                             │
│  ├─ Data Integrity Constraints                          │
│  ├─ Indexes and Performance Optimization                │
│  └─ Audit Trails                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/              # Shared UI components
│   │   │   ├── Header
│   │   │   ├── Sidebar
│   │   │   ├── Button
│   │   │   ├── Modal
│   │   │   ├── Table
│   │   │   └── Form
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── MainLayout
│   │   │   └── AuthLayout
│   │   │
│   │   └── feature/             # Feature-specific components
│   │       ├── [Feature]Component
│   │       └── ...
│   │
│   ├── layouts/
│   │   ├── DashboardLayout
│   │   ├── AdminLayout
│   │   └── PublicLayout
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage
│   │   │   └── LogoutPage
│   │   ├── dashboard/
│   │   ├── [Module]Page/        # One per module
│   │   └── NotFoundPage
│   │
│   ├── features/
│   │   ├── auth/                # Authentication logic
│   │   ├── [Module]Feature/     # One per business module
│   │   └── common/              # Cross-cutting features
│   │
│   ├── hooks/
│   │   ├── useAuth
│   │   ├── usePermissions
│   │   ├── useFetch
│   │   └── ...
│   │
│   ├── services/
│   │   ├── api/                 # API client configuration
│   │   ├── [Module]Service      # One per module
│   │   └── AuthService
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice
│   │   │   ├── userSlice
│   │   │   └── ...
│   │   ├── store.ts             # Redux store configuration
│   │   └── hooks.ts             # Redux hooks
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── [Module].types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── api.ts               # API utilities
│   │   ├── auth.ts              # Auth utilities
│   │   ├── format.ts            # Data formatting
│   │   ├── validation.ts        # Form validation
│   │   └── common.ts            # Common utilities
│   │
│   ├── config/
│   │   ├── api.config.ts        # API configuration
│   │   ├── app.config.ts        # App configuration
│   │   └── constants.ts         # Constants
│   │
│   ├── App.tsx                  # Root component
│   └── index.tsx                # Entry point
│
└── public/
    ├── index.html
    └── assets/
```

### Key Architectural Patterns

#### Component Architecture

```
Smart Components (Containers)
├─ Connect to Redux store
├─ Handle data fetching
├─ Manage complex state
└─ Pass props to Presentational Components
    │
    └─ Presentational Components
       ├─ Pure functional components
       ├─ Accept props only
       ├─ Focus on UI rendering
       └─ Highly reusable
```

#### State Management

- **Redux** for global state (auth, user, roles)
- **React Context** for theme, permissions
- **Component State** for local UI state
- **React Query** for server state (optional)

#### Authentication Flow

```
1. User Login
   └─ Submit credentials
       └─ API call to /auth/login
           └─ Receive JWT token
               └─ Store in Redux + LocalStorage
                   └─ Set Authorization header
                       └─ Redirect to dashboard
```

#### Permission-Based Rendering

```
<ProtectedComponent requiredPermissions={['read:users', 'update:users']}>
  {/* Component only renders if user has all permissions */}
</ProtectedComponent>
```

---

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── [module-name]/
│   │   │   ├── [module-name].controller.ts
│   │   │   ├── [module-name].service.ts
│   │   │   ├── [module-name].repository.ts
│   │   │   ├── [module-name].routes.ts
│   │   │   ├── [module-name].validators.ts
│   │   │   └── types.ts
│   │   └─ [23 modules total]
│   │
│   ├── controllers/
│   │   └─ (Route handlers - delegates to services)
│   │
│   ├── services/
│   │   └─ (Business logic, cross-module orchestration)
│   │
│   ├── repositories/
│   │   └─ (Data access layer, Prisma queries)
│   │
│   ├── routes/
│   │   ├── index.ts            # Main route aggregator
│   │   ├── auth.routes.ts
│   │   ├── [module].routes.ts  # One per module
│   │   └─ ...
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── requestValidator.middleware.ts
│   │   ├── logger.middleware.ts
│   │   └─ ...
│   │
│   ├── validators/
│   │   ├── auth.validators.ts
│   │   ├── [module].validators.ts
│   │   └─ ...
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── [module].types.ts
│   │   ├── common.types.ts
│   │   └─ roles.types.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── helpers.ts
│   │   └─ ...
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── cors.ts
│   │   └─ ...
│   │
│   └── app.ts               # Express app setup
│
├── prisma/
│   └── schema.prisma        # Database schema
│
└── package.json
```

### Module Structure Pattern

Each module follows a consistent structure:

```
auth/
├── auth.controller.ts        # Request handlers
├── auth.service.ts           # Business logic
├── auth.repository.ts        # Database queries
├── auth.routes.ts            # Route definitions
├── auth.validators.ts        # Request validation
└── types.ts                  # Module types
```

#### Controller

```typescript
// Handles HTTP requests/responses
// Minimal logic - delegates to service
export class AuthController {
  async login(req, res) {
    const result = await authService.login(req.body);
    res.json(result);
  }
}
```

#### Service

```typescript
// Contains business logic
// Orchestrates repositories
// Can call other services
export class AuthService {
  async login(credentials) {
    const user = await userRepository.findByEmail(credentials.email);
    // Business logic here
    return { token, user };
  }
}
```

#### Repository

```typescript
// Data access layer
// Uses Prisma ORM
export class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }
}
```

### Request Processing Pipeline

```
HTTP Request
    ↓
Express Middleware Chain
├─ CORS
├─ Body Parser
├─ Logger
├─ Auth Middleware (validate JWT)
├─ RBAC Middleware (check permissions)
├─ Request Validator (validate input)
    ↓
Route Handler (Controller)
├─ Input validation
├─ Call Service
├─ Format response
    ↓
Service Layer
├─ Business logic
├─ Validation
├─ Call Repository
├─ Orchestrate other services
    ↓
Repository Layer
├─ Database queries
├─ Data transformation
    ↓
Database (PostgreSQL)
    ↓
Service → Controller → Middleware Chain
    ↓
HTTP Response
```

---

## Module Organization

### Module Categories

#### 1. Authentication & Authorization (1 module)

- **auth:** Login, logout, token refresh, JWT management

#### 2. User & Role Management (1 module)

- **users:** Application users, role assignment, permissions

#### 3. Employee Management (4 modules)

- **employees:** Employee records, profiles
- **attendance:** Attendance tracking
- **leave:** Leave requests and management
- **overtime:** Overtime tracking and approval

#### 4. Production (1 module)

- **production:** Production schedules, runs, quality control

#### 5. Inventory & Warehouse (2 modules)

- **inventory:** Stock management, warehouse operations
- **distributors:** Distributor master records

#### 6. Distribution & Sales (4 modules)

- **distribution:** Distribution planning, logistics
- **orders:** Sales order management
- **sales:** Sales tracking
- **returns:** Return management

#### 7. Financial Management (3 modules)

- **invoices:** Invoice creation and management
- **payments:** Payment processing
- **expenses:** Expense recording
- **payroll:** Salary calculation (from HR)

#### 8. Procurement (2 modules)

- **suppliers:** Supplier master records
- **purchases:** Purchase orders, procurement

#### 9. Cross-Cutting Concerns (3 modules)

- **reports:** Analytics and reporting
- **notifications:** Email, SMS, system notifications
- **audit:** Audit logging, compliance tracking

### Inter-Module Communication

```
Frontend Service Layer
├─ AuthService (auth module)
├─ UserService (users module)
├─ EmployeeService (employees module)
│   └─ [calls] AttendanceService, LeaveService, PayrollService
├─ ProductionService (production module)
│   └─ [calls] InventoryService
├─ InventoryService (inventory module)
│   └─ [calls] NotificationService
├─ OrderService (orders module)
│   └─ [calls] InventoryService, InvoiceService
├─ InvoiceService (invoices module)
│   └─ [calls] PaymentService, NotificationService
└─ ReportService (reports module)
    └─ [aggregates from all modules]
```

---

## RBAC System

### Role Definitions

```typescript
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STORE_MANAGER = 'store_manager',
  ACCOUNTANT = 'accountant',
  DISTRIBUTOR = 'distributor'
}
```

### Permission Structure

```typescript
interface Permission {
  id: string;
  resource: string;        // e.g., 'users', 'employees', 'inventory'
  action: string;          // e.g., 'create', 'read', 'update', 'delete'
  scope?: string;          // e.g., 'own', 'team', 'all'
}

// Example: 'users:read:all' - can read all users
// Example: 'employees:update:team' - can update only team employees
```

### Role-Permission Mapping

```
ADMIN
├─ users:*:*              (Full access to users)
├─ employees:*:*          (Full access to employees)
├─ modules:*:*            (Access to all modules)
├─ system:configure       (System configuration)
└─ audit:read:all         (View audit logs)

MANAGER
├─ employees:read:team    (Read own team employees)
├─ employees:update:team  (Update own team employees)
├─ attendance:read:team
├─ attendance:update:team
├─ leave:read:team
├─ leave:approve:team     (Approve leaves)
├─ overtime:read:team
├─ overtime:approve:team  (Approve overtime)
├─ production:read:area   (If assigned Production area)
├─ production:update:area
├─ inventory:read:area    (If assigned Store area)
├─ distribution:read:area (If assigned Distribution area)
└─ reports:read:area

STORE_MANAGER
├─ inventory:*:all        (Full inventory access)
├─ orders:read:all        (View all orders)
├─ orders:update:status   (Update order status)
├─ returns:manage:all
├─ warehouse:manage:all
└─ reports:read:warehouse

ACCOUNTANT
├─ invoices:*:all         (Full invoice access)
├─ payments:*:all         (Full payment access)
├─ expenses:*:all         (Full expense access)
├─ payroll:read:all       (View payroll)
├─ payroll:process        (Process payroll)
├─ suppliers:read:all
├─ purchases:read:all
└─ reports:read:financial

DISTRIBUTOR
├─ orders:read:assigned   (View assigned orders)
├─ orders:update:status   (Update delivery status)
├─ distribution:update:own (Manage own deliveries)
├─ returns:read:own
├─ returns:create:own
├─ customers:read:assigned
└─ reports:read:own
```

---

## Permission Model

### Permission Categories

```
RESOURCE-ACTION-SCOPE Model:

Format: {resource}:{action}:{scope}

Resources:
  users, employees, attendance, leave, overtime, payroll,
  production, inventory, distributors, distribution, orders,
  sales, returns, invoices, payments, suppliers, purchases,
  expenses, reports, notifications, audit

Actions:
  create, read, update, delete, approve, process, generate, export

Scopes:
  own          - Only own records
  team         - Team/assigned area records
  area         - Assigned operational area
  all          - All records in the system
  [custom]     - Feature-specific scopes
```

### Permission Checking Middleware

```typescript
async function checkPermission(req, res, next) {
  const userRole = req.user.role;
  const requiredPermission = req.requiredPermission;
  
  const hasPermission = await rbacService.checkPermission(
    userRole,
    requiredPermission
  );
  
  if (!hasPermission) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Usage in routes:
router.get('/users', 
  authMiddleware, 
  checkPermission('users:read:all'),
  userController.listUsers
);
```

---

## Manager Area Assignment

### Operational Areas

```typescript
enum ManagerArea {
  PRODUCTION = 'production',
  STORE = 'store',
  DISTRIBUTION = 'distribution'
}
```

### Area Assignment Structure

```typescript
interface ManagerAssignment {
  id: string;
  userId: string;
  managerId: string;
  areas: ManagerArea[];      // Array of assigned areas
  createdAt: Date;
  updatedAt: Date;
}
```

### Query Filtering by Area

When a Manager queries data, the repository automatically filters by assigned area:

```typescript
// Example: Manager queries employee list
// Repository automatically filters:
async getTeamEmployees(managerId: string, area: ManagerArea) {
  return prisma.employee.findMany({
    where: {
      department: area,        // Filter by assigned area
      managerId: managerId
    }
  });
}
```

### Multi-Area Managers

A Manager can be assigned to multiple areas:

```
Manager: Rajesh Kumar
├─ Production Area
│   └─ Can manage: Production schedules, production employees
├─ Store Area
│   └─ Can manage: Inventory, warehouse operations
└─ Distribution Area
    └─ Can manage: Deliveries, distribution logistics
```

### Permission Inheritance

```
Manager with Production Area
├─ production:read:area
├─ production:update:area
├─ production:create:run
├─ employees:read:team      (Production team only)
├─ employees:update:team    (Production team only)
├─ attendance:read:team
├─ attendance:update:team
├─ payroll:read:team
├─ reports:read:area
└─ Can ONLY access data for production area
   (Cannot see store or distribution data)
```

---

## Database Architecture

### Schema Organization

```
Database: aquanexus

Tables (Domains):

1. AUTHENTICATION & AUTHORIZATION
   ├─ users           (App users with credentials)
   ├─ roles           (Role definitions)
   └─ permissions     (Permission definitions)

2. EMPLOYEE MANAGEMENT
   ├─ employees       (Employee records)
   ├─ attendance      (Attendance records)
   ├─ leave_requests  (Leave applications)
   ├─ leave_balance   (Annual leave balance)
   └─ overtime        (Overtime records)

3. PAYROLL
   ├─ payroll_runs    (Payroll processing)
   ├─ salary_details  (Salary structure)
   └─ payroll_records (Individual salary records)

4. PRODUCTION
   ├─ production_runs (Production schedules)
   ├─ production_logs (Production execution logs)
   └─ quality_checks  (Quality control records)

5. INVENTORY
   ├─ inventory_items (Product/material master)
   ├─ warehouse_stock (Current stock levels)
   ├─ stock_movement  (Inbound/outbound logs)
   ├─ warehouse       (Warehouse master)
   └─ inventory_audit (Stock audit trails)

6. DISTRIBUTION & SALES
   ├─ distributors    (Distributor master)
   ├─ orders          (Sales orders)
   ├─ order_items     (Order line items)
   ├─ deliveries      (Delivery tracking)
   ├─ sales_returns   (Return management)
   └─ customers       (Customer records - optional)

7. FINANCIAL
   ├─ invoices        (Invoice records)
   ├─ invoice_items   (Invoice line items)
   ├─ payments        (Payment records)
   ├─ expenses        (Expense records)
   ├─ suppliers       (Supplier master)
   └─ purchase_orders (Purchase orders)

8. CROSS-CUTTING
   ├─ audit_logs      (User action audit trail)
   ├─ notifications   (Notification queue)
   └─ manager_areas   (Manager area assignments)
```

### Key Relationships

```
User → Role → Permissions
   ↓
Employee ← Attendance
        ← Leave
        ← Overtime
        ← Payroll

Production Run ← Inventory ← Warehouse Stock
            ↓
    Order ← Sales Return
        ↓
    Invoice ← Payment
        ↓
    Supplier ← Purchase Order

Manager → Manager Areas → Employees
       → Manager Areas → Production/Inventory/Distribution
```

### Design Principles

1. **Normalization:** Reduce data redundancy
2. **Referential Integrity:** Foreign key constraints
3. **Audit Trail:** Track creation/update timestamps and users
4. **Soft Deletes:** Maintain historical data integrity
5. **Indexing:** Performance optimization on frequently queried columns

---

## Security Architecture

### Authentication Flow

```
1. Login Request
   ├─ Receive: { email, password }
   └─ Hash password using bcrypt
       ↓
2. User Lookup
   ├─ Query: User.findByEmail()
   ├─ If not found → Return 401 Unauthorized
   └─ If found → Compare password hash
       ↓
3. Token Generation
   ├─ Create JWT payload: { userId, role, areas, permissions }
   ├─ Set expiration: 24 hours
   ├─ Sign with secret key
   └─ Return { accessToken, refreshToken }
       ↓
4. Token Storage (Frontend)
   ├─ accessToken → In-memory / SessionStorage (XSS protection)
   ├─ refreshToken → HttpOnly Cookie (CSRF protection)
   └─ Set Authorization header for subsequent requests
       ↓
5. Request Authorization
   ├─ Middleware extracts token from header
   ├─ Verify signature and expiration
   ├─ Extract user info from payload
   ├─ Load user permissions from cache/DB
   └─ Proceed or reject based on required permission
```

### Authorization Flow

```
Request arrives with JWT token
    ↓
Auth Middleware
├─ Verify token validity
├─ Extract user info
└─ Attach to req.user
    ↓
RBAC Middleware
├─ Check required permission
├─ If Manager: Check area assignment
├─ If allowed: Continue
└─ If denied: Return 403 Forbidden
    ↓
Controller → Service → Repository
    ↓
Data Query (Repository)
├─ Apply area/scope filters
├─ Apply permission-based field filtering
└─ Return filtered results
```

### Encryption & Data Protection

```
HTTPS/TLS
└─ All API communications encrypted

Passwords
├─ Hashed with bcrypt (cost factor: 10+)
└─ Never stored in plaintext

Sensitive Data (PII, Financial)
├─ Encrypted at rest (AES-256)
├─ Decrypted on-demand
└─ Audit logged

JWT Tokens
├─ Signed with HS256
├─ Include expiration
├─ Refresh mechanism for extended sessions
└─ Stored securely on frontend
```

### Audit & Compliance

```
All operations logged:
├─ User ID performing action
├─ Action type (CREATE, UPDATE, DELETE, etc.)
├─ Resource and record ID
├─ Timestamp
├─ IP address
├─ Old/New values (for updates)
└─ Reason (if provided)

Retention Policy
├─ Logs kept for minimum 2 years
├─ Archived after 6 months
└─ Immutable audit trail
```

---

## API Architecture

### RESTful API Design

```
Resource-Based Endpoints:

Employees
├─ GET    /api/v1/employees                    # List all
├─ POST   /api/v1/employees                    # Create
├─ GET    /api/v1/employees/:id                # Read one
├─ PUT    /api/v1/employees/:id                # Update
└─ DELETE /api/v1/employees/:id                # Delete

Attendance
├─ GET    /api/v1/employees/:id/attendance     # Get attendance
├─ POST   /api/v1/attendance                   # Create record
└─ PUT    /api/v1/attendance/:id               # Update

Leave
├─ GET    /api/v1/leave/requests               # List requests
├─ POST   /api/v1/leave/requests               # Create request
├─ PUT    /api/v1/leave/requests/:id/approve   # Approve
└─ PUT    /api/v1/leave/requests/:id/reject    # Reject

Orders
├─ GET    /api/v1/orders                       # List orders
├─ POST   /api/v1/orders                       # Create order
├─ GET    /api/v1/orders/:id                   # Get order details
└─ PUT    /api/v1/orders/:id/status            # Update status

Payments
├─ GET    /api/v1/payments                     # List payments
├─ POST   /api/v1/payments                     # Record payment
└─ GET    /api/v1/payments/:id                 # Get details

Reports
├─ GET    /api/v1/reports/production           # Production report
├─ GET    /api/v1/reports/financial            # Financial report
├─ GET    /api/v1/reports/inventory            # Inventory report
└─ GET    /api/v1/reports/payroll              # Payroll report
```

### Response Format

```typescript
// Success Response
{
  success: true,
  data: { /* actual data */ },
  meta: {
    timestamp: "2026-08-31T10:30:00Z",
    path: "/api/v1/employees",
    version: "1.0"
  }
}

// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    details: [
      { field: "email", message: "Must be valid email" }
    ]
  },
  meta: {
    timestamp: "2026-08-31T10:30:00Z",
    path: "/api/v1/employees",
    traceId: "trace-123456"
  }
}
```

### Pagination

```
GET /api/v1/employees?page=2&limit=20&sort=name:asc

Response:
{
  success: true,
  data: [ /* items */ ],
  pagination: {
    page: 2,
    limit: 20,
    total: 150,
    pages: 8,
    hasNext: true,
    hasPrev: true
  }
}
```

### Filtering & Search

```
GET /api/v1/employees?name=john&department=production&status=active

GET /api/v1/orders?startDate=2026-01-01&endDate=2026-08-31&status=pending

GET /api/v1/inventory?warehouse=main&category=chemicals&lowStock=true
```

---

## Data Flow

### Create Order (End-to-End)

```
1. FRONTEND
   User fills order form
   └─ Form validation (client-side)
       └─ POST /api/v1/orders { customerId, items, quantity }

2. API LAYER
   OrderController.createOrder()
   ├─ Check auth middleware (user authenticated?)
   ├─ Check RBAC middleware (has 'orders:create' permission?)
   ├─ Validate request (all fields present/valid?)
   └─ Call service layer

3. SERVICE LAYER
   OrderService.createOrder()
   ├─ Validate business rules
   │   └─ Customer exists?
   │   └─ Items available in inventory?
   │   └─ Sufficient stock?
   ├─ Call repository to create order
   ├─ Call InventoryService.reserveStock()
   ├─ Call NotificationService.notifyWarehouse()
   └─ Return created order

4. REPOSITORY LAYER
   OrderRepository.create()
   ├─ Build Prisma query
   ├─ Execute with transaction
   ├─ Persist to database
   └─ Return created record

5. DATABASE
   INSERT INTO orders (...)
   INSERT INTO order_items (...)
   INSERT INTO audit_logs (...)
   └─ Return with generated ID

6. SERVICE RESPONSE
   Service returns order object
   └─ Call audit service to log action

7. API RESPONSE
   Controller formats response
   ├─ HTTP 201 Created
   ├─ Location header with resource URL
   ├─ Response body with order details
   └─ Send to client

8. FRONTEND
   Display success message
   ├─ Update local state/Redux
   ├─ Redirect to order details page
   └─ Show notification
```

### Approval Workflow (Leave Request)

```
1. Employee submits leave request
   └─ POST /api/v1/leave/requests

2. API receives request
   ├─ Authenticate user
   ├─ Check permission (can create leave request)
   ├─ Validate data
   └─ Call LeaveService

3. LeaveService processes
   ├─ Check annual leave balance
   ├─ Check overlapping leaves
   ├─ Create leave request record
   ├─ Find assigned manager
   ├─ Notify manager via NotificationService
   └─ Return request details

4. Database persists
   ├─ INSERT leave_request
   ├─ INSERT audit_log
   └─ Returns record

5. Notification sent to Manager
   ├─ Email notification
   ├─ In-app notification
   └─ SMS (optional)

6. Manager approves/rejects
   └─ PUT /api/v1/leave/requests/:id/approve

7. API processes approval
   ├─ Check permission (can approve)
   ├─ Verify request still pending
   └─ Call LeaveService.approve()

8. LeaveService updates
   ├─ Update request status
   ├─ If approved: Update leave balance
   ├─ Notify employee
   └─ Log in audit trail

9. Database updated
   └─ UPDATE leave_request

10. Employee notified
    └─ Sees approval status in dashboard
```

---

## Deployment Architecture

### Development Environment

```
Local Machine
├─ Frontend (npm start)
│   └─ React dev server on port 3000
├─ Backend (npm run dev)
│   └─ Express on port 5000
└─ Database
    └─ PostgreSQL on localhost:5432
        (or Docker container)
```

### Production Environment

```
Cloud Provider (AWS/GCP/Azure)

├─ CDN Layer
│   └─ CloudFront/CDN for static assets
│
├─ Frontend
│   ├─ S3/Cloud Storage for static files
│   ├─ React build artifacts
│   └─ Served through CDN
│
├─ API Layer (Auto-scaling)
│   ├─ Docker containers
│   ├─ Kubernetes / ECS / App Engine
│   ├─ Load balancer
│   ├─ Auto-scaling based on load
│   └─ Multiple instances for HA
│
├─ Database Layer
│   ├─ Managed PostgreSQL (RDS/Cloud SQL)
│   ├─ Automated backups
│   ├─ Read replicas
│   └─ Point-in-time recovery
│
└─ Monitoring & Logging
    ├─ Application performance monitoring
    ├─ Centralized logging
    ├─ Error tracking
    └─ Alerting
```

### CI/CD Pipeline

```
Developer pushes code
    ↓
GitHub Actions triggered
    ↓
Tests
├─ Unit tests
├─ Integration tests
└─ E2E tests
    ↓
Build
├─ Frontend build
└─ Backend Docker image
    ↓
Deploy to Staging
├─ Deploy frontend
├─ Deploy backend
└─ Run smoke tests
    ↓
Manual approval
    ↓
Deploy to Production
├─ Blue-green deployment
├─ Gradual rollout
└─ Health checks
```

---

## Summary

The Aqua Nexus architecture is designed to be:

- **Scalable:** Horizontal scaling of API layer
- **Secure:** RBAC, encryption, audit logging
- **Maintainable:** Clear separation of concerns, modular design
- **Performant:** Optimized queries, caching, CDN
- **Reliable:** Automated testing, CI/CD, monitoring
- **Auditable:** Complete action tracking and compliance logging

This foundation supports the planned 23-module business logic and enables future enhancements without major refactoring.

---

