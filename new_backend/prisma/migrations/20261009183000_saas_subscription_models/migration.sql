-- ============================================================
-- Migration: 20261009183000_saas_subscription_models
-- AquaNexus SaaS Transformation: Platform & Subscriptions
-- ============================================================

-- 1. Create Enums if not exist
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionBillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Company profile columns to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contact_email" VARCHAR(255);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "contact_phone" VARCHAR(50);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "city" VARCHAR(100);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "state" VARCHAR(100);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "country" VARCHAR(100) DEFAULT 'India';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(20);

-- 3. Create subscription_plans table
CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "billing_cycle" "SubscriptionBillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "max_roles" INTEGER,
    "features" JSONB,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_name_key" ON "subscription_plans"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_code_key" ON "subscription_plans"("code");

-- 4. Seed Standard SaaS Plans: BASIC, PRO, PRO_MAX
INSERT INTO "subscription_plans" ("id", "name", "code", "description", "price", "billing_cycle", "max_users", "features", "is_custom", "is_active")
VALUES 
    ('c0000000-0000-4000-8000-000000000001', 'Basic Plan', 'BASIC', 'Designed for small water plant operations. Allows 1 authorized business role/account.', 999.00, 'MONTHLY', 1, '["PRODUCTION", "INVENTORY", "ORDERS"]'::jsonb, false, true),
    ('c0000000-0000-4000-8000-000000000002', 'Pro Plan', 'PRO', 'Comprehensive water management with up to 5 authorized team accounts.', 2999.00, 'MONTHLY', 5, '["PRODUCTION", "INVENTORY", "ORDERS", "DISTRIBUTION", "FINANCE", "HR"]'::jsonb, false, true),
    ('c0000000-0000-4000-8000-000000000003', 'Pro Max Plan', 'PRO_MAX', 'Enterprise plan with customizable pricing, duration, and tailored user capacity.', 9999.00, 'MONTHLY', 50, '["PRODUCTION", "INVENTORY", "ORDERS", "DISTRIBUTION", "FINANCE", "HR", "P2P", "ADVANCED_ANALYTICS"]'::jsonb, true, true)
ON CONFLICT ("code") DO NOTHING;

-- 5. Create company_subscriptions table
CREATE TABLE IF NOT EXISTS "company_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ,
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "custom_price" DECIMAL(12,2),
    "billing_cycle" "SubscriptionBillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "features" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "company_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "company_subscriptions_organization_id_idx" ON "company_subscriptions"("organization_id");
CREATE INDEX IF NOT EXISTS "company_subscriptions_status_idx" ON "company_subscriptions"("status");

-- 6. Backfill existing organizations with active PRO subscriptions so they do not break
INSERT INTO "company_subscriptions" ("id", "organization_id", "plan_id", "status", "start_date", "end_date", "max_users", "billing_cycle")
SELECT 
    gen_random_uuid(),
    o."id",
    'c0000000-0000-4000-8000-000000000002', -- Pro Plan
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '365 days',
    10, -- Generous allowance for existing backfilled organizations
    'MONTHLY'
FROM "organizations" o
WHERE NOT EXISTS (
    SELECT 1 FROM "company_subscriptions" cs WHERE cs."organization_id" = o."id"
);

-- 7. Create subscription_payments table
CREATE TABLE IF NOT EXISTS "subscription_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "payment_type" VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    "transaction_ref" VARCHAR(100),
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "recorded_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "company_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "subscription_payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "subscription_payments_organization_id_idx" ON "subscription_payments"("organization_id");

-- 8. Create subscription_histories table
CREATE TABLE IF NOT EXISTS "subscription_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "subscription_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "performed_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_histories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_histories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_histories_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "company_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "subscription_histories_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "subscription_histories_organization_id_idx" ON "subscription_histories"("organization_id");

-- 9. Create platform_settings table
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    "description" VARCHAR(255),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_settings_key_key" ON "platform_settings"("key");

-- Seed initial Platform Owner settings
INSERT INTO "platform_settings" ("key", "value", "category", "description")
VALUES
    ('PLATFORM_NAME', 'AquaNexus SaaS', 'BRANDING', 'Platform Name'),
    ('PLATFORM_OWNER', 'Aazira Solution', 'BRANDING', 'Platform Owner Enterprise Name'),
    ('SUPPORT_EMAIL', 'support@aazira.com', 'SUPPORT', 'Default Platform Support Contact'),
    ('DEFAULT_CURRENCY', 'INR', 'FINANCE', 'Platform Billing Currency'),
    ('ALLOW_SELF_SIGNUP', 'false', 'SECURITY', 'Public self-signup policy')
ON CONFLICT ("key") DO NOTHING;
