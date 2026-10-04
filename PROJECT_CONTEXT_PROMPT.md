# AquaNexus Project Context Prompt

Copy the prompt below into a new ChatGPT conversation. For implementation-level help, also attach the repository/archive or enable ChatGPT's access to the workspace. This prompt is a detailed project map, not a literal copy of every source file; the actual repository remains authoritative.

---

## MASTER PROMPT (BEGIN)

You are helping me understand, maintain, analyze, and extend **AquaNexus**, a water-plant operations and management ERP. Treat the following as the initial project briefing. If you have access to the repository, inspect the relevant current files before making implementation claims or changes. Do not assume this briefing or older documentation replaces source-code verification.

### 1. Project in One Paragraph

AquaNexus is a web ERP for water treatment/bottling and distribution businesses. It connects HR/employee administration, attendance/leave/overtime, production, central inventory, distributor operations, order/dispatch/sales/returns, finance/payroll, notifications, and audit trails. It is designed for multiple independent customer organizations (tenants), each with one or more company Admins and subordinate operational users. A platform-level AquaNexus SuperAdmin provisions and governs customer organizations and can deliberately operate in a tenant context. The repository currently contains a working-looking React/TypeScript UI and Express/Prisma API, a PostgreSQL schema and migrations, seeds, and a DB-backed multi-tenancy integration test suite. Distinguish what code actually implements from what product or architecture documents merely propose.

### 2. Source-of-Truth and Analysis Rules

Use this precedence when sources conflict:

1. Current executable source, schema, migrations, route wiring, tests, and package scripts.
2. Current API/database implementation documentation where it agrees with code.
3. README, ARCHITECTURE, CONTRIBUTING, and other planning documents.
4. Comments, old examples, and filenames.

Many docs are planning templates or stale descriptions. Do not report a capability as implemented solely because README, ARCHITECTURE.md, docs, comments, or a test name says it exists. Read the relevant controller, middleware, schema/migration, and caller. Mark statements as **implemented**, **documented/planned**, or **uncertain/needs verification**. If a user asks for a security review, trace actual reads, writes, filters, relations, role checks, and failure paths. Do not infer complete tenant isolation from the presence of organization IDs or middleware alone.

When making changes, preserve established patterns and unrelated user changes, implement the smallest root-cause fix, add focused tests, and run the narrowest meaningful validation first. Never expose secrets, weaken security/tests, destructively reset a database, or claim to have run checks that were not run. Do not commit or push unless explicitly requested.

### 3. Actual Repository Layout

- Root Vite/React application: `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`.
- Backend: `new_backend/`, CommonJS Node/Express, Prisma and PostgreSQL.
- Main backend entry point: `new_backend/src/index.js`.
- Prisma schema and migrations: `new_backend/prisma/schema.prisma`, `new_backend/prisma/migrations/`.
- Primary seed: `new_backend/prisma/seed.js`.
- Separate demo seed: `new_backend/seedDemo.cjs`.
- Database setup notes: `new_backend/DATABASE.md`.
- Backend automated test: `new_backend/tests/multitenancy.test.js`.
- Project overview and architecture: `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`.
- Other docs: `docs/API.md`, `docs/api/operations-api.md`, and README/index files under docs/api, architecture, database, decisions, requirements, roles, and workflows.
- Existing `prompt.md` is specifically a Phase 1 multi-tenancy implementation brief. It is not the general project documentation; keep that distinction in mind.

The frontend uses a React Router route registry (`src/routes.tsx`). Some UI files live in a Next-style `src/app/(dashboard)/...` folder structure and use `@/` imports and local Next shims, but the root app is built with Vite and React Router. Do not mistake folder naming for a Next.js runtime. The frontend manifest does not list Next.js or a frontend test runner.

### 4. Technology, Commands, and Runtime Shape

**Frontend (`package.json` at repository root):** React 18, TypeScript, Vite 5, React Router 6, Tailwind CSS, Recharts, lucide-react. Scripts:

- `npm run dev`: Vite development server.
- `npm run build`: `tsc && vite build`.
- `npm run lint`: ESLint over `src`.
- `npm run preview`: Vite preview.

**Backend (`new_backend/package.json`):** Node.js CommonJS, Express 5, Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`, `pg`), bcryptjs, jsonwebtoken, express-validator, dotenv, cors. Scripts:

- `npm start`: `node src/index.js`.
- `npm run dev`: nodemon.
- `npm test`: `node --test tests/multitenancy.test.js`.
- Prisma config: `new_backend/prisma.config.ts`; datasource URL comes from `DATABASE_URL`.

The API defaults to port 5000 and is mounted under `/api`. The Vite frontend's API helpers default to `http://localhost:5000`, with `VITE_API_URL` (and a legacy Next-style env fallback) supported. The backend requires environment configuration such as PostgreSQL `DATABASE_URL` and a secure `JWT_SECRET`. Never copy real `.env` values into responses or documentation. DB tests require a suitable migrated/test database and credentials; tests may create/delete test fixtures, so inspect their cleanup/setup before running them against any non-disposable database.

### 5. Business Roles and Access Concept

Roles used in code/seeds:

- `SUPER_ADMIN`: AquaNexus platform operator. Intended singleton, not a customer Admin. Manages organizations and may enter tenant ERP context.
- `ADMIN`: customer/company administrator, full operational capabilities within its own organization.
- `MANAGER`: operational manager; manager area assignment is stored in `ManagerAssignment` (`PRODUCTION`, `STORE`, `DISTRIBUTION`).
- `STORE_MANAGER`: inventory/store operations.
- `ACCOUNTANT`: finance, payroll, invoices/payments/expenses.
- `DISTRIBUTOR`: distributor portal and its linked distributor records.
- `EMPLOYEE`: employee-facing/self-service attendance, leave, overtime and profile capabilities.

An Employee business record is not synonymous with an application User. `Employee.userId` is optional and unique; a person can be an HR record without a login, and an application User may not necessarily have an employee profile.

Backend role checks use normalized `UserRole`/`Role` records and permission codes; some privileged roles have explicit middleware bypasses. The UI has its own role mapping/navigation/permission display, but UI authorization is not a security boundary. Verify that every role and tenant rule is also enforced on the server.

### 6. Backend Architecture and Request Flow

`new_backend/src/index.js` configures dotenv, Express, CORS, JSON parsing, a health-like `GET /api` response, route registration, a JSON 404, and a global error handler. Route families:

- `/api/auth` -> `auth.routes.js`
- `/api/platform` and `/api` -> `organization.routes.js` (organization endpoints therefore have platform-prefixed and unprefixed registrations)
- `/api` -> `admin.routes.js` (users, roles, permissions)
- `/api/manager-assignments`
- `/api/employees`
- `/api/attendance`
- `/api/leave` and alias `/api/leaves`
- `/api/overtime`
- `/api/products`
- `/api/production`
- `/api` -> inventory routes (inventory, stock transactions, goods received)
- `/api` -> distribution routes (sales areas, distributors, distributor stock)
- `/api/orders`
- `/api/dispatch`
- `/api/suppliers`
- `/api/audit-logs`
- `/api` -> finance routes
- `/api` -> sales/returns routes
- `/api/notifications`

Backend code is organized by `controllers/`, `routes/`, `middleware/`, `services/`, `utils/`, and `validators/`; controllers contain much of the domain/data-access logic. Services currently include audit and notifications. Shared middleware includes authentication, RBAC, manager area, and tenant context. DB setup is in `src/config/db.js`, using a `pg` Pool and PrismaPg adapter.

Authentication (`auth.middleware.js`): validates a Bearer JWT, then reloads the user and related organization, roles/permissions, distributor links, manager assignments, and employee record from the DB. User status and suspended tenant status are checked. It attaches normalized role/isSuperAdmin information to `req.user`. Login (`auth.controller.js`) accepts email or username and password, verifies bcrypt hash, loads role/org data, signs a one-day JWT, and returns the user plus token. `GET /auth/me` returns the authenticated user; logout does not revoke a stateless JWT. Login uses the database role; the frontend maps that response to a UI role.

RBAC (`rbac.middleware.js`) has explicit Admin/SuperAdmin permission bypass behavior, employee-specific permission shortcuts, an Accountant employee-view exception, a Store Manager production-create exception, and manager-area checks. Any change to these bypasses can affect many routes; trace route middleware order and data-level scoping before altering them.

Tenant context (`tenant.middleware.js`) intends to bind normal users to their authenticated `organizationId`, reject inactive/suspended orgs, permit SuperAdmin to select a tenant via `X-Organization-Id` or `organizationId` query, and audit SuperAdmin access. In the current implementation, a SuperAdmin with no selection is silently assigned the earliest active organization. Review this default carefully: it is not the same as requiring explicit tenant choice. Ordinary users' organization comes from the loaded DB user, not a trusted client role claim. `requireSuperAdmin` is separate from tenant context and protects organization governance routes.

Organization endpoints are implemented in `organization.controller.js` and guarded by `requireAuth` + `requireSuperAdmin`: list/search organizations with counts/Admins, fetch organization details, provision an organization plus initial Admin/departments/employee profile transactionally, add an Admin, and change organization status. Provisioning accepts an initial Admin password through the API body. Treat credential handling and initial credential delivery as security-sensitive.

### 7. Multi-Tenant Data Model and Security Boundaries

`Organization` has UUID ID, name, unique slug, status (`ACTIVE`, `SUSPENDED`, `INACTIVE`), timestamps, and relations to tenant-owned data. `User` has nullable organization relation, `isSuperAdmin`, and unique `superAdminSlot`; the migration also creates a partial unique index for one `is_super_admin=true` user. SuperAdmin is intended to have no organization; tenant users should belong to one organization.

Migration history includes the initial schema migration and `20260929120000_multitenant_phase1`. The multi-tenant migration creates a default `AquaNexus Primary Plant` organization, adds/backfills organization IDs on users and business tables, makes many business table tenant columns non-null, adds organization FKs/indexes, changes many unique keys to organization-scoped composite unique indexes, creates/assigns `SUPER_ADMIN`, and inserts a SuperAdmin bootstrap user with a fixed hash. Do not treat this seed/bootstrap credential as safe for production. Review migration idempotency, production exposure, existing-data assumptions, data preservation, and rollback/constraint behavior before changing or applying it.

The schema contains organization IDs on major tenant-owned roots, including departments, employees, attendance, leave, overtime, products, production, inventory, stock transactions, goods received, sales areas, distributors, orders, dispatches, sales, returns, suppliers, invoices, payments, expenses, payroll, notifications, and audit logs. Some child/join tables instead inherit ownership through parent relations and do not themselves carry `organizationId` (for example order/dispatch/sale/return items, user-distributor links, distributor stock, user-role links, and manager assignments). A direct FK to a record plus an organization ID on the owning record does **not by itself** prevent cross-tenant links. When reviewing tenant security, check all nested IDs/relations and writes: product-to-production/order items, user-to-distributor links, order/distributor, invoice/order/sale, employee/department, approver/creator, and any other related entity. Database composite tenant-aware foreign keys are not generally evident from the Prisma relations, so verify actual constraints and server-side checks rather than assuming them.

Current middleware and tests indicate tenant isolation is a major requirement, but tests must be read for coverage and execution. In particular, check notification routes (auth is mounted, but no tenant middleware is visible on that router), auth endpoints (tenant context is not applied there), user/role routes, report/count/aggregate queries, and any organization management path. Check that `INACTIVE` and `SUSPENDED` are handled consistently for both tenant users and SuperAdmin-selected tenants. Check if `X-Organization-Id` is ignored for tenant users and never accepted as authorization evidence. SuperAdmin cross-tenant access should be explicit and audited, and organization platform operations must not accidentally inherit a tenant default.

`requireRole` currently contains a SuperAdmin special-case bypass, while the admin route group requires role `ADMIN`; determine precisely whether SuperAdmin is meant to access those routes and whether selected tenant context remains enforced. Do not make authorization broader while trying to fix UI navigation.

### 8. Complete Prisma Data Inventory

The current `schema.prisma` has 36 models (the older `new_backend/DATABASE.md` describes 35 and omits the Organization model) and 26 enums (that doc says 23). The following is the code-level model inventory grouped by domain:

**Tenant and access:**

- `Organization`: customer tenant and lifecycle status.
- `User`: credentials/profile/status, optional organization, SuperAdmin markers, related roles, areas, distributor links, employee profile, notifications and actor relations.
- `Role`, `Permission`, `UserRole`, `RolePermission`: global role/permission definitions and M:N assignments.
- `ManagerAssignment`: user-to-operational-area mapping.

**HR and time:**

- `Department`, `Employee`, `Attendance`, `Leave`, `Overtime`.
- Employee belongs to organization and department, may map 1:1 to a User; attendance/leave/overtime link to employee and tenant, with approver links where applicable.

**Products, production, inventory:**

- `Product`, `Production`, `Inventory`, `StockTransaction`, `GoodsReceived`.
- Production and goods receipt link to product and actor; inventory is one-to-one with product; stock history uses typed transactions. Business validations documented in schema include non-negative stock, reserved <= quantity, dispatch <= available stock, returns <= eligible stock, received <= remaining production, payment <= outstanding invoice, arithmetic totals, date ordering, matching production/product, and transactions for multi-table stock operations. Verify which rules are enforced in controllers/tests versus merely comments.

**Distribution, orders, sales:**

- `SalesArea`, `Distributor`, `UserDistributor`, `DistributorStock`, `Order`, `OrderItem`, `Dispatch`, `DispatchItem`, `Sale`, `SaleItem`, `Return`, `ReturnItem`.
- Orders/dispatches/sales/returns link to distributors and optional source records; line items reference products. Distributor authorization uses `UserDistributor` links and helper `utils/distributorAccess.js`; inspect it for server-derived distributor ownership.

**Finance and system:**

- `Supplier`, `Invoice`, `Payment`, `Expense`, `Payroll`, `Notification`, `AuditLog`.
- Invoice payments, supplier expenses, employee payroll, record actors/approvers, notifications and audit links are represented.

Enums in source: `OrganizationStatus`, `UserStatus`, `ManagerArea`, `DepartmentStatus`, `EmploymentType`, `EmployeeStatus`, `AttendanceStatus`, `LeaveType`, `LeaveStatus`, `OvertimeStatus`, `ProductStatus`, `ProductionStatus`, `TransactionType`, `DistributorStatus`, `OrderStatus`, `DispatchStatus`, `SaleStatus`, `ReturnStatus`, `ReturnCondition`, `SupplierStatus`, `InvoiceStatus`, `PaymentMethod`, `PaymentStatus`, `ExpenseStatus`, `PayrollStatus`, `NotificationType`.

Money uses Decimal types, IDs are UUIDs, date-only values use date fields and timestamps use timestamptz. Many business identifiers are unique within an organization using composite unique keys. Not every relation is tenant-aware at the database constraint level; do not claim that it is.

### 9. API Families and Domain Workflows

Read each `new_backend/src/routes/*.routes.js` and matching controller for exact methods, access middleware, request validation, query scope, and response shape. The high-level route inventory is:

- Auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Organizations (SuperAdmin): `GET/POST /api/platform/organizations`, `GET /api/platform/organizations/:id`, `POST /api/platform/organizations/:id/admins`, `PATCH /api/platform/organizations/:id/status`; organization router is also mounted at `/api`.
- User/security: `GET/POST /api/users`, `GET/PATCH /api/users/:id`, `GET /api/roles`, `GET /api/permissions`.
- Manager assignments: list, get by user, assign, update, delete under `/api/manager-assignments`.
- Employees/departments: read list/detail/departments, create, update, delete under `/api/employees`.
- Attendance: list and record under `/api/attendance`.
- Leave and overtime: list/create/status update under `/api/leave` (also `/api/leaves`) and `/api/overtime`.
- Products and production: products list/detail/create/update under `/api/products`; production list/stats/detail/create/status under `/api/production`.
- Inventory: `/api/inventory`, `/api/inventory/low-stock`, `/api/stock-transactions`, `/api/goods-received`, including stock movement and receipt operations.
- Distribution: `/api/sales-areas`, `/api/distributors`, `/api/distributor-stock`.
- Orders and dispatch: `/api/orders`, `/api/orders/:id`, `/api/dispatch`.
- Sales and returns: inspect `sales.routes.js` for exact paths; includes sales and return operations.
- Finance: inspect `finance.routes.js` for invoice/payment/expense/payroll endpoints.
- Suppliers: list/create/update/delete under `/api/suppliers`.
- Audit: `GET /api/audit-logs`.
- Notifications: list own notifications and mark one read under `/api/notifications`.

Most routes use the standard JSON envelope `{ success, data, message }` (errors `{ success: false, data: null, message }`), with controller-specific details possible. `docs/API.md` and `docs/api/operations-api.md` give endpoint examples but may be stale; validate paths, permissions, status codes, and DTOs against route/controller code.

Core business lifecycle concepts:

1. HR creates employees/departments; attendance, leave, and overtime attach to employee records, with status approvals.
2. Production creates a batch for a product. Creating production alone does not necessarily add stock.
3. Goods receipt records finished production output and, according to the documented business rule, should atomically create receipt/stock history and increase central inventory; fully received batches may complete.
4. Orders price from current product values and have item lines; dispatch moves central stock to distributor stock and should be transactional with stock history.
5. Sales/returns, distributor stock, invoices/payments, expenses, and payroll connect downstream operations and finance.
6. Notifications and audit logs are cross-cutting.

For any workflow change, inspect its controller's transaction boundary and whether every referenced record is constrained to the same organization/distributor/user context.

### 10. Frontend Architecture and Screens

Entry points: `src/main.tsx`, `src/App.tsx`, `src/routes.tsx`. Auth state is held in `src/context/AuthContext.tsx`; API/auth helpers are in `src/lib/auth.ts`, `src/services/apiClient.ts`, `src/lib/api-client.ts`, and `src/lib/api.ts`. Shared frontend models live in `src/types/`; backend-facing feature adapters include `src/services/attendanceService.ts`, `employeeService.ts`, `leaveService.ts`, `overtimeService.ts`, and `productionService.ts`.

The UI uses React Router, a shared `DashboardLayout`, layout/auth components, reusable controls under `src/components/ui/`, charts, and role-oriented pages under `src/app/(dashboard)/...`, plus legacy/shared pages and views. `src/routes.tsx` enumerates public home/login, protected role areas and shared operational pages. Role groups include:

- SuperAdmin organization governance (`/superadmin/organizations`).
- Admin dashboards, user/role/permission management, manager assignments, departments, audit, employee and operational oversight.
- Manager dashboard, employees, attendance, leave/overtime approvals, production, store/distribution and reports.
- Store dashboard, inventory/detail/low-stock, goods received, stock-in/out, damaged goods, returns, dispatch, reports and transactions.
- Distributor dashboard, products, orders/create/detail, stock, sales, returns, invoices, payments, outstanding, dispatch.
- Accountant dashboard, invoices, payroll, deductions, payments, outstanding, expenses, reports, suppliers.
- Employee dashboard/profile, attendance, leave, overtime and notifications.

`src/lib/navigation.ts` creates navigation by role and manager assignments and rewrites some routes for Admin/Manager dashboards. `AuthGuard` is a UI guard only; APIs remain authoritative.

The login client maps the backend role name to a UI role and stores auth user/token and selected organization in localStorage. `AuthContext` hydrates from cached localStorage state and does not visibly refresh `/auth/me` during its initial mount; verify behavior if token/session revalidation is in scope. `src/services/apiClient.ts` reads `aqua_nexus_selected_org_id` and attaches `X-Organization-Id` to API calls. That header must only provide context for authenticated SuperAdmin; normal users' organization must remain bound to their authenticated DB record. The SuperAdmin organization screen switches the selected org locally and redirects to the Admin dashboard, provisions org/Admin data and toggles status; check that frontend request fields match the backend DTOs and that no frontend-selected ID grants authority by itself.

### 11. Seeding and Demo Data

There are two seed paths, and they are not guaranteed equivalent:

- `new_backend/prisma/seed.js` creates/upserts the default tenant, roles, permission codes and role grants, persona users, manager area assignments, departments, employees, products/inventory, production/goods receipt, sales areas/distributors, and further operational sample data. It uses a common development password hash generated at runtime and prints development login information.
- `new_backend/seedDemo.cjs` also creates default tenant, roles, users, singleton SuperAdmin and a smaller demo dataset. Its user-upsert behavior/role reconciliation differs from the primary seed, and it should be checked for consistent identity/role/tenant results.
- The tenant migration itself also creates a default organization and inserts a SuperAdmin row/hash. Avoid introducing a second or conflicting SuperAdmin and review bootstrap secret handling. Seed credentials are development-only and must never be represented as production credentials.

Before changing seed scripts, decide and document the intended canonical seed and ensure repeated runs are idempotent without silently moving existing users across tenants, granting stale roles, or creating duplicate identities.

### 12. Tests and Existing Documentation Caveats

`new_backend/tests/multitenancy.test.js` is a Node built-in test runner integration suite. Its stated acceptance categories include singleton SuperAdmin/multiple customer Admins, tenant isolation, prevention of SuperAdmin promotion/tenant movement, singleton/concurrency invariants, audited SuperAdmin access, suspension, continued operational-role behavior, migration backfill, and database-authenticated role mapping. A test title/comment is not proof that every aspect is covered: inspect assertions, setup, cleanup, concurrency behavior, and whether it can run safely in the configured DB.

Frontend scripts provide build and lint but no visible test command in the root package. There is no claim here that current tests/build are passing; run them when asked and report exact results.

Documentation drift to remember:

- `README.md` says implementation has not started, although source code, backend, migrations, UI, seeds, and tests now exist.
- `ARCHITECTURE.md` presents idealized React/Redux/backend-layer structures that do not match all current directories or dependencies.
- `CONTRIBUTING.md` references a planned `frontend/` and `backend/` layout and scripts unlike this repository.
- `docs/` contains many promised-but-not-present files and framework placeholders.
- `new_backend/DATABASE.md` has inaccurate model/enum counts and some setup text from the earlier layout.
- `docs/API.md` and `docs/api/operations-api.md` need source verification.
- The existing `prompt.md` is a demanding Phase 1 implementation specification, not evidence that all requirements have been completely implemented.

### 13. Important Verification Questions for Any Deep Analysis

When asked to analyze, debug, secure, or modify the project, examine the relevant code and answer these questions when applicable:

1. What is the actual request path from UI to route, middleware, controller, Prisma query, and response?
2. Is the behavior implemented, merely documented, or absent?
3. Are role checks, tenant filters, distributor/user ownership, and related-record validation enforced server-side for list/detail/search/count/aggregate/export/bulk/create/update/delete paths?
4. Can a submitted ID reference a record from another organization through nested relations, line items, approvers, creator IDs, distributor mappings, or document links?
5. Do multi-row stock/finance operations use transactions, safe balance checks, and concurrency-safe updates?
6. Do disabled/suspended/inactive account and organization states behave consistently in login, auth middleware, tenant context, SuperAdmin selection, and frontend session state?
7. Are SuperAdmin-only platform endpoints isolated from tenant operational endpoints, and is tenant selection explicit and audited?
8. Do migration and seed scripts preserve existing data and maintain the one-SuperAdmin invariant without production secrets or unsafe defaults?
9. Do the exact API contracts match frontend DTOs and documentation?
10. What focused test, typecheck/build, lint, Prisma validation, migration check, or manual check would falsify the proposed fix?

### 14. How to Respond to Future Requests

For a question, answer directly with concrete evidence and paths. For a code change, first inspect the controlling implementation and nearest test; state a short, falsifiable hypothesis and a focused check, then make a minimal change and run that check. For a project-wide analysis, organize findings by architecture, behavior, security/data integrity, tests, docs drift, and risks, and distinguish confirmed findings from items needing further inspection. For reviews, lead with severity-ordered actionable findings and precise paths. Use Markdown links to real repository paths where possible.

Never claim that one prompt can replace the source repository: if a question requires an exact implementation detail that is not described here and no repo access/files are available, say what file or evidence is needed instead of inventing an answer.

## MASTER PROMPT (END)
