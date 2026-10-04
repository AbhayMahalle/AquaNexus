# Antigravity Implementation Prompt: AquaNexus Phase 1

Implement Phase 1 of AquaNexus as a secure multi-tenant ERP with a platform-level SuperAdmin and company-level Admins. This is an end-to-end implementation task, not a documentation-only role addition. Inspect the existing code before changing it, preserve current operational features, and complete the work in this repository.

## Business Model (Source of Truth)

- AquaNexus is the platform vendor. There is exactly **one SuperAdmin account** controlled by AquaNexus.
- Each company that purchases the ERP is an independent customer organization (tenant). A company is represented by one or more **Admin** accounts. There may be many Admin accounts across the platform; do not impose a global one-Admin limit.
- The existing Admin experience and operational role hierarchy remain intact. Admin keeps the existing Admin capabilities, but those capabilities apply only to the Admin's own company.
- SuperAdmin has all capabilities available to Admin, plus platform-wide access to manage customer organizations and access their data when explicitly operating in that organization. Do not replace, rename, or demote Admin.
- Managers, Store Managers, Accountants, Distributors, Employees, and all business records belong to exactly one customer organization. They cannot access another organization's data.
- A role label, URL, query parameter, request body field, or frontend state is never proof of authorization. The authenticated identity and tenant context must be verified server-side.

## Repository Context

- Frontend: React, TypeScript, Vite under `src/`.
- Backend: Express, JavaScript, Prisma, PostgreSQL under `new_backend/`.
- Main database schema and seed: `new_backend/prisma/schema.prisma` and `new_backend/prisma/seed.js`.
- There is also a separate demo seed script, `new_backend/seedDemo.cjs`. Inspect and reconcile both seeding paths so they cannot create conflicting role/account behavior.
- Login, role mapping, guards, navigation, user management, controllers, services, routes, and existing tests/docs may have changed. Read their current contents; do not assume earlier implementation notes describe the current worktree.

## Required Workflow

1. Inspect the current schema, migrations, auth flow, role and permission logic, every business model/controller/service/query, frontend routes and guards, seed scripts, docs, and available tests. Search all role checks and all tenant-sensitive read/write paths.
2. Before editing, summarize the current architecture, identify migration/data risks, and give a concise implementation plan. Then implement; do not stop after a proposal.
3. Make incremental, focused changes. Preserve unrelated user changes and existing behavior. Do not reset, truncate, or reseed a real database as a shortcut.
4. Add or update migrations, code, UI, tests, and documentation. Run the relevant backend tests, Prisma validation/generation, frontend typecheck/build, and lint where available. Report commands and outcomes accurately.

## Tenant Data Model and Migration

- Introduce a first-class customer organization/tenant model with a stable ID, name, unique slug/code, lifecycle status, and timestamps.
- Associate every customer Admin and subordinate user with exactly one organization. SuperAdmin is the single platform identity and is not an ordinary tenant Admin.
- Ensure every organization-owned business record is tenant-scoped, directly by organization ID where practical or through an ownership relationship that is enforced and cannot cross tenants. Inventory the entire Prisma schema; do not scope only the obvious models. Include departments, employees, attendance, leave, overtime, payroll, products, production, stock, suppliers, orders, dispatches, distributors, sales, returns, invoices, payments, expenses, notifications, audit data, and all related/join records as applicable.
- Prevent cross-tenant foreign-key relationships. Add tenant-aware uniqueness constraints where values are only unique within a company (for example employee codes, product SKUs, or department codes). Preserve genuinely global identifiers only when appropriate.
- Design a safe, versioned PostgreSQL/Prisma migration for existing data. Assign all existing rows and users to a clearly named default organization, preserve IDs and relationships, backfill before making tenant ownership mandatory, and document rollback/recovery considerations. Never discard existing operational data.
- Do not use `prisma db push` or database reset as the production migration strategy. Use migrations and validate them against the current schema and repository conventions.

## Authentication, Authorization, and Isolation

- Establish tenant context from the verified authenticated user on the server. Do not let an Admin choose or override their organization by supplying `organizationId` in a request.
- Admin queries and mutations must be scoped to the caller's organization at the data-access boundary, including list/detail endpoints, nested relations, search, counts, dashboards, reports, exports, bulk operations, and background jobs.
- For ID-based access, verify the target record belongs to the caller's tenant before returning or mutating it. Return a consistent not-found/forbidden response without leaking another tenant's data.
- SuperAdmin may work across organizations, but cross-tenant access should be explicit: provide platform-level organization management and a deliberate organization context for tenant operations. Record actor, selected organization, action, and target in audit logs.
- Preserve the current Admin permission set. SuperAdmin must have at least the same permissions, with platform-level organization management. Do not rely only on frontend guards or a special-case role bypass that accidentally skips tenant scoping.
- Admins may manage users and roles only inside their organization. They cannot create, promote, demote, disable, or reassign the SuperAdmin; cannot move users or business records between organizations; and cannot change the organization on their own account.
- Provision customer organizations through SuperAdmin workflows, including creating the organization and its initial Admin securely. Define organization activation/suspension behavior and ensure suspended organizations cannot continue using tenant APIs.
- Enforce the exactly-one-SuperAdmin invariant at the database/transaction boundary, not with a race-prone count check alone. Use a robust singleton representation/constraint and secure bootstrap procedure. Do not hardcode production SuperAdmin credentials or expose account-creation secrets in the frontend or seed output.

## Frontend and Login

- Keep the existing Admin dashboard and operational UI available to Admin with tenant-scoped data.
- Add a platform SuperAdmin experience for listing, provisioning, activating/suspending, and entering customer organizations. Reuse existing Admin screens for tenant operations where appropriate rather than duplicating the entire ERP.
- SuperAdmin must be visibly identifiable as the AquaNexus platform role; Admin must be clearly associated with its company.
- The frontend may hide unavailable actions, but every authorization rule must also be enforced by the API.
- A demo persona selector, if retained, is only a development convenience. It must authenticate a real seeded identity and must never let the client override the role returned by the backend. Ensure both seed scripts produce consistent development behavior without creating a second SuperAdmin.
- Keep login, refresh/current-user state, route guards, navigation, role management, and user management consistent with backend role and tenant data.

## Required Tests and Acceptance Criteria

Add automated tests using the repository's existing test setup (or establish a small appropriate test setup if none exists) for at least these cases:

1. One SuperAdmin and two customer organizations can exist; each organization can have multiple Admin users.
2. Admin A can use all existing Admin capabilities for Organization A and cannot read, search, aggregate, export, create against, update, or delete Organization B records, even when submitting B's IDs or forged organization IDs.
3. Admin cannot create/promote a SuperAdmin, change their tenant, manage another tenant's users, or attach records across tenants.
4. Exactly one SuperAdmin can be provisioned, including under concurrent attempts; unauthorized users cannot claim or alter the singleton account.
5. SuperAdmin can manage organizations and deliberately access each tenant; audit records capture the platform actor and selected tenant.
6. Suspended organizations are denied tenant access.
7. Existing Admin workflows and non-admin operational roles continue to work within their organization.
8. Migration/backfill preserves pre-existing records and correctly places them in the default organization.
9. Login and frontend role mapping use the authenticated backend role, not a client-supplied role override.

Phase 1 is complete only when database schema/migration, backend authorization and tenant scoping, frontend workflows, both seed paths, tests, and docs agree on the model. A role string or UI-only tenant selector is not completion.

## Constraints

- Do not push, publish, or commit anything to GitHub.
- Do not weaken authentication, authorization, validation, or tests to make the build pass.
- Do not put real secrets or production credentials in source control, documentation, screenshots, or terminal output.
- Do not make unrelated refactors. Follow the project's existing patterns and preserve current user changes.
- At completion, summarize implemented behavior, migration/backfill steps required to run it, tests run and results, any remaining blockers, and explicitly state that nothing was pushed to GitHub.
