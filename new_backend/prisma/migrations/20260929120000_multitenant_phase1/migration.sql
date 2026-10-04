-- ============================================================
-- Migration: 20260929120000_multitenant_phase1
-- AquaNexus Multi-Tenant Architecture & Data Isolation
-- ============================================================

-- 1. Create OrganizationStatus Enum
DO $$ BEGIN
    CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Organizations Table
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug");

-- 3. Provision Default Organization for Pre-Existing Operational Data
INSERT INTO "organizations" ("id", "name", "slug", "status", "created_at", "updated_at")
VALUES ('d0000000-0000-4000-8000-000000000001', 'AquaNexus Primary Plant', 'aquanexus-primary', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 4. Add Multi-Tenant and Singleton SuperAdmin Columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "super_admin_slot" VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS "users_super_admin_slot_key" ON "users"("super_admin_slot");
CREATE UNIQUE INDEX IF NOT EXISTS "users_single_super_admin_idx" ON "users"("is_super_admin") WHERE ("is_super_admin" = true);
CREATE INDEX IF NOT EXISTS "users_organization_id_idx" ON "users"("organization_id");

-- Backfill existing users to default organization
UPDATE "users" 
SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' 
WHERE "organization_id" IS NULL AND "is_super_admin" = false;

-- 5. Add organization_id to all business tables
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "overtime" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "production" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "stock_transactions" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "goods_received" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "sales_areas" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "distributors" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "dispatches" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "payroll" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "organization_id" UUID;

-- 6. Backfill all business tables to the default organization
UPDATE "departments" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "employees" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "attendance" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "leaves" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "overtime" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "products" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "production" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "inventory" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "stock_transactions" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "goods_received" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "sales_areas" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "distributors" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "orders" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "dispatches" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "sales" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "returns" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "suppliers" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "invoices" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "payments" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "expenses" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "payroll" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "notifications" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;
UPDATE "audit_logs" SET "organization_id" = 'd0000000-0000-4000-8000-000000000001' WHERE "organization_id" IS NULL;

-- 7. Enforce NOT NULL on business tables
ALTER TABLE "departments" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "attendance" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "leaves" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "overtime" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "production" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "inventory" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "stock_transactions" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "goods_received" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "sales_areas" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "distributors" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "dispatches" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "returns" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "payroll" ALTER COLUMN "organization_id" SET NOT NULL;

-- 8. Replace global unique constraints with composite tenant-scoped unique constraints
-- Departments
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_name_key";
ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "departments_code_key";
DROP INDEX IF EXISTS "departments_name_key";
DROP INDEX IF EXISTS "departments_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "departments_organization_id_name_key" ON "departments"("organization_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "departments_organization_id_code_key" ON "departments"("organization_id", "code");
CREATE INDEX IF NOT EXISTS "departments_organization_id_idx" ON "departments"("organization_id");

-- Employees
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_employee_code_key";
DROP INDEX IF EXISTS "employees_employee_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "employees_organization_id_employee_code_key" ON "employees"("organization_id", "employee_code");
CREATE INDEX IF NOT EXISTS "employees_organization_id_idx" ON "employees"("organization_id");

-- Attendance, Leaves, Overtime indexes
CREATE INDEX IF NOT EXISTS "attendance_organization_id_idx" ON "attendance"("organization_id");
CREATE INDEX IF NOT EXISTS "leaves_organization_id_idx" ON "leaves"("organization_id");
CREATE INDEX IF NOT EXISTS "overtime_organization_id_idx" ON "overtime"("organization_id");

-- Products
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_sku_key";
DROP INDEX IF EXISTS "products_sku_key";
CREATE UNIQUE INDEX IF NOT EXISTS "products_organization_id_sku_key" ON "products"("organization_id", "sku");
CREATE INDEX IF NOT EXISTS "products_organization_id_idx" ON "products"("organization_id");

-- Production
ALTER TABLE "production" DROP CONSTRAINT IF EXISTS "production_production_number_key";
ALTER TABLE "production" DROP CONSTRAINT IF EXISTS "production_batch_number_key";
DROP INDEX IF EXISTS "production_production_number_key";
DROP INDEX IF EXISTS "production_batch_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "production_organization_id_production_number_key" ON "production"("organization_id", "production_number");
CREATE UNIQUE INDEX IF NOT EXISTS "production_organization_id_batch_number_key" ON "production"("organization_id", "batch_number");
CREATE INDEX IF NOT EXISTS "production_organization_id_idx" ON "production"("organization_id");

-- Inventory & Stock Transactions
CREATE INDEX IF NOT EXISTS "inventory_organization_id_idx" ON "inventory"("organization_id");
CREATE INDEX IF NOT EXISTS "stock_transactions_organization_id_idx" ON "stock_transactions"("organization_id");

-- Goods Received
ALTER TABLE "goods_received" DROP CONSTRAINT IF EXISTS "goods_received_grn_number_key";
DROP INDEX IF EXISTS "goods_received_grn_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "goods_received_organization_id_grn_number_key" ON "goods_received"("organization_id", "grn_number");
CREATE INDEX IF NOT EXISTS "goods_received_organization_id_idx" ON "goods_received"("organization_id");

-- Sales Areas
ALTER TABLE "sales_areas" DROP CONSTRAINT IF EXISTS "sales_areas_name_key";
ALTER TABLE "sales_areas" DROP CONSTRAINT IF EXISTS "sales_areas_code_key";
DROP INDEX IF EXISTS "sales_areas_name_key";
DROP INDEX IF EXISTS "sales_areas_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "sales_areas_organization_id_name_key" ON "sales_areas"("organization_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_areas_organization_id_code_key" ON "sales_areas"("organization_id", "code");
CREATE INDEX IF NOT EXISTS "sales_areas_organization_id_idx" ON "sales_areas"("organization_id");

-- Distributors
ALTER TABLE "distributors" DROP CONSTRAINT IF EXISTS "distributors_distributor_code_key";
DROP INDEX IF EXISTS "distributors_distributor_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "distributors_organization_id_distributor_code_key" ON "distributors"("organization_id", "distributor_code");
CREATE INDEX IF NOT EXISTS "distributors_organization_id_idx" ON "distributors"("organization_id");

-- Orders
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_order_number_key";
DROP INDEX IF EXISTS "orders_order_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "orders_organization_id_order_number_key" ON "orders"("organization_id", "order_number");
CREATE INDEX IF NOT EXISTS "orders_organization_id_idx" ON "orders"("organization_id");

-- Dispatches
ALTER TABLE "dispatches" DROP CONSTRAINT IF EXISTS "dispatches_dispatch_number_key";
DROP INDEX IF EXISTS "dispatches_dispatch_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "dispatches_organization_id_dispatch_number_key" ON "dispatches"("organization_id", "dispatch_number");
CREATE INDEX IF NOT EXISTS "dispatches_organization_id_idx" ON "dispatches"("organization_id");

-- Sales
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_sale_number_key";
DROP INDEX IF EXISTS "sales_sale_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "sales_organization_id_sale_number_key" ON "sales"("organization_id", "sale_number");
CREATE INDEX IF NOT EXISTS "sales_organization_id_idx" ON "sales"("organization_id");

-- Returns
ALTER TABLE "returns" DROP CONSTRAINT IF EXISTS "returns_return_number_key";
DROP INDEX IF EXISTS "returns_return_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "returns_organization_id_return_number_key" ON "returns"("organization_id", "return_number");
CREATE INDEX IF NOT EXISTS "returns_organization_id_idx" ON "returns"("organization_id");

-- Suppliers
ALTER TABLE "suppliers" DROP CONSTRAINT IF EXISTS "suppliers_supplier_code_key";
DROP INDEX IF EXISTS "suppliers_supplier_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_organization_id_supplier_code_key" ON "suppliers"("organization_id", "supplier_code");
CREATE INDEX IF NOT EXISTS "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- Invoices
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_invoice_number_key";
DROP INDEX IF EXISTS "invoices_invoice_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_organization_id_invoice_number_key" ON "invoices"("organization_id", "invoice_number");
CREATE INDEX IF NOT EXISTS "invoices_organization_id_idx" ON "invoices"("organization_id");

-- Payments
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_payment_number_key";
DROP INDEX IF EXISTS "payments_payment_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "payments_organization_id_payment_number_key" ON "payments"("organization_id", "payment_number");
CREATE INDEX IF NOT EXISTS "payments_organization_id_idx" ON "payments"("organization_id");

-- Expenses
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_expense_number_key";
DROP INDEX IF EXISTS "expenses_expense_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "expenses_organization_id_expense_number_key" ON "expenses"("organization_id", "expense_number");
CREATE INDEX IF NOT EXISTS "expenses_organization_id_idx" ON "expenses"("organization_id");

-- Payroll, Notifications, Audit Logs indexes
CREATE INDEX IF NOT EXISTS "payroll_organization_id_idx" ON "payroll"("organization_id");
CREATE INDEX IF NOT EXISTS "notifications_organization_id_idx" ON "notifications"("organization_id");
CREATE INDEX IF NOT EXISTS "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- 9. Add Foreign Key constraints to organizations
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtime" ADD CONSTRAINT "overtime_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production" ADD CONSTRAINT "production_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_received" ADD CONSTRAINT "goods_received_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_areas" ADD CONSTRAINT "sales_areas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Bootstrap the Singleton SuperAdmin Role and User securely
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES ('a0000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'Global access across all customer organizations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Grant all permissions to SUPER_ADMIN
INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Seed the single SuperAdmin if not already existing
INSERT INTO "users" ("id", "username", "email", "password_hash", "first_name", "last_name", "status", "is_super_admin", "super_admin_slot", "organization_id", "created_at", "updated_at")
VALUES (
    'b0000000-0000-4000-8000-000000000001',
    'superadmin',
    'superadmin@aquanexus.com',
    '$2b$10$kxY.tKksplj3X3YVC6iO6eWz9kYCVArLiivcPPZ.PkUm3p.4b1v2O', -- Password@123
    'AquaNexus',
    'SuperAdmin',
    'ACTIVE',
    true,
    'SUPER_ADMIN',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("super_admin_slot") DO NOTHING;

-- Assign role
INSERT INTO "user_roles" ("user_id", "role_id", "created_at")
SELECT u."id", r."id", CURRENT_TIMESTAMP
FROM "users" u, "roles" r
WHERE u."super_admin_slot" = 'SUPER_ADMIN' AND r."name" = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;
