# AquaNexus — Water Plant Management & ERP System

AquaNexus is an enterprise-grade, centralized **Water Plant Management System (ERP)** and multi-tenant SaaS platform designed to streamline operations across water treatment, bottle production, inventory control, route distribution, sales orders, employee scheduling, and financial accounting.

---

## Table of Contents

- [Overview](#overview)
- [Key Features & Modules](#key-features--modules)
- [System Architecture](#system-architecture)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Subscription & Quota Model](#subscription--quota-model)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Local Development Setup](#local-development-setup)
- [Default Demo Credentials](#default-demo-credentials)
- [API Endpoints Overview](#api-endpoints-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AquaNexus provides water treatment and packaging plants with an end-to-end operational platform. From raw water purification monitoring and packaging batch logs to fleet dispatch routing and ledger accounting, AquaNexus replaces disjointed spreadsheets and paper logs with a unified, real-time management dashboard.

### Core Value Propositions
- **Unified Operations:** Centralizes production, inventory, delivery routes, and bookkeeping in a single interface.
- **Multi-Tenant SaaS Platform:** Super Admin platform controls tenant company provisioning, subscription tiers, and payment recording.
- **Strict Quota Enforcement:** Subscription tiers govern business account creation while keeping plant floor employees unlimited.
- **Real-Time Audit & Traceability:** Tracks inventory movements, batch quality testing, and dispatch workflows end-to-end.

---

## Key Features & Modules

### 1. Platform Super Admin
- **Company Management:** Provision new water plant organizations with custom slugs, contact details, and activation statuses.
- **Subscription Plans:** Configure plan tiers (Basic, Plus, Pro, Pro Max) with prices, billing cycles, and authorized user caps.
- **Payments & Billing:** Record bank transfers and payments, manage active subscriptions, and view platform MRR analytics.
- **Organization Directory:** Inspect all system users and plant staff across tenant companies.

### 2. Tenant Admin Dashboard
- **Operational KPIs:** Real-time visibility into daily water output (Liters), stock inventory, active staff, and revenue.
- **Plan Status & All Plans Popup:** Live subscription entitlement card with interactive popup displaying all platform plans, pricing, and features fetched dynamically from the database.
- **Strict Limit Warnings:** Automatic alerts and user deletion flows when a tenant exceeds their plan's account quota.
- **System User Management:** Provision and manage role-based business accounts.

### 3. Production & Quality Control
- **Batch Processing:** Log daily production batches, target output volumes, and water source meters.
- **Lab Quality Testing:** Record water quality parameters including pH, TDS, Turbidity, Chlorine, and Hardness.
- **Resource Tracking:** Monitor raw water consumption, filter usage, and preform bottle yields.

### 4. Inventory & Store Management
- **Multi-SKU Stock Control:** Manage 20L jars, 1L bottles, 500ml bottles, bottle caps, labels, and packaging materials.
- **Stock Movement:** Log Goods Received Notes (GRN), Stock-In, Stock-Out, and damaged/broken jar deductions.
- **Reorder Alerts:** Automatic low-stock warnings when inventory drops below safety thresholds.

### 5. Sales, Dispatch & Route Logistics
- **Order Management:** Create and process wholesale customer sales orders, invoices, and delivery notes.
- **Route Distribution:** Assign delivery vehicles and drivers to delivery routes.
- **Empty Bottle Returns:** Track empty 20L jar returns from distributors and clients to minimize bottle leakage.

### 6. Finance & Double-Entry Accounting
- **Invoicing & Billing:** Generate GST-compliant invoices and record payments against customer accounts.
- **Ledger & Expenses:** Track operating expenses (electricity, fuel, chemicals, maintenance) and customer receivables.
- **Financial Analytics:** Overview of revenue, gross margins, outstanding dues, and cash flow.

### 7. HR & Plant Staff Management
- **Employee Directory:** Manage plant floor workers, machine operators, drivers, and quality technicians.
- **Unlimited Staffing:** Plant employees never count against subscription business user limits.
- **Shifts & Attendance:** Track worker shifts, attendance logs, overtime, and monthly payroll summaries.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (SPA)                           │
│  React 18 • TypeScript • Vite • Tailwind CSS • Lucide Icons     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS / REST API
┌───────────────────────────────▼─────────────────────────────────┐
│                    API LAYER (Node.js)                          │
│  Express 4 • JWT Auth Middleware • Tenant Scoping Middleware    │
│  Role & Quota Guards • Audit Logging Service                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Prisma ORM
┌───────────────────────────────▼─────────────────────────────────┐
│                    DATA LAYER (PostgreSQL)                      │
│  Multi-tenant Tables • Foreign Key Constraints • Indexes        │
│  Organizations • Subscriptions • Users • Batches • Orders       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control (RBAC)

AquaNexus implements a strict, hierarchical role-based permission system:

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | Platform-Wide | Provision companies, configure plans, assign subscriptions, view all payments |
| **Admin** | Tenant Company | Organization settings, user provisioning, production oversight, finance, subscription |
| **Manager** | Tenant Company | Daily production scheduling, inventory movement approval, shift management |
| **Store Manager** | Tenant Company | Goods receiving, stock-in/out, physical inventory audits, damaged item logs |
| **Accountant** | Tenant Company | Invoices, customer payments, ledger journals, expense vouchers |
| **Distributor** | Tenant / Client | Sales orders, delivery route status, bottle returns |
| **Supplier** | Tenant / Vendor | Raw material delivery confirmations, supply order status |
| **Employee** | Operational Record | Operational plant floor workers, drivers, machine technicians (unlimited) |

---

## Subscription & Quota Model

All subscription tiers share the complete suite of system modules. Tiers differ strictly by **authorized business user accounts**:

| Plan Tier | Price | Authorized Business Users | Plant Staff / Employees | Included Features |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Plan** | ₹999 / mo | **1 User** (1 Admin) | **Unlimited** | All Platform Modules |
| **Plus Plan** | ₹1,999 / mo | **2 Users** | **Unlimited** | All Platform Modules |
| **Pro Plan** | ₹2,999 / mo | **5 Users** | **Unlimited** | All Platform Modules |
| **Pro Max Plan** | ₹9,999 / mo | **50 Users** | **Unlimited** | All Platform Modules + P2P |

---

## Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS & Vanilla CSS
- **Icons:** Lucide React
- **Routing:** React Router DOM (v6)
- **HTTP Client:** Fetch API client with automatic JWT bearer injection

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **ORM:** Prisma ORM
- **Database:** PostgreSQL
- **Security:** JSON Web Tokens (JWT), BcryptJS password hashing, CORS, Helmet

---

## Project Structure

```
AquaNexus/
├── .env.example              # Frontend environment variables template
├── index.html                # Vite entry HTML
├── vite.config.ts            # Vite bundler configuration
├── tailwind.config.ts        # Tailwind theme and design tokens
├── package.json              # Frontend dependencies and scripts
│
├── src/                      # Frontend Source Code
│   ├── components/           # Reusable UI components (Button, Modal, Table, etc.)
│   │   ├── auth/             # Auth guards & route protection
│   │   ├── layout/           # DashboardLayout, Sidebar, Navbar, PageHeader
│   │   └── ui/               # Design system primitives (Card, Badge, Input, Select)
│   ├── views/                # Role-based views & pages
│   │   ├── superadmin/       # Platform management, subscriptions, organizations
│   │   ├── admin/            # Tenant dashboard, users, production, reports
│   │   ├── manager/          # Manager operational views
│   │   ├── store/            # Inventory, stock-in, stock-out, damaged goods
│   │   ├── distributor/      # Distributor delivery & returns
│   │   └── auth/             # Login & password reset pages
│   ├── services/             # API services (apiClient, productionService, etc.)
│   └── lib/                  # Utilities, formatters, validation helpers
│
└── new_backend/              # Backend Source Code
    ├── .env.example          # Backend environment variables template
    ├── package.json          # Backend dependencies and scripts
    ├── prisma/
    │   └── schema.prisma     # Prisma database schema definition
    └── src/
        ├── config/           # Database connection & environment loaders
        ├── controllers/      # Route controllers (platform, auth, production, inventory)
        ├── middleware/       # Auth guards, tenant scoping, role verification
        ├── routes/           # Express REST API routes
        ├── services/         # Business logic (subscriptions, audit logs, calculations)
        └── index.js          # Express app entrypoint (Port 5000)
```

---

## Environment Configuration

AquaNexus requires environment variables for both the frontend and backend. Templates are provided via `.env.example` files.

### 1. Backend Environment (`new_backend/.env`)

Copy `new_backend/.env.example` to `new_backend/.env`:

```bash
cd new_backend
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/aquanexus?schema=public` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `aquanexus_super_secret_jwt_key_2026` |

### 2. Frontend Environment (`.env`)

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:5000/api` |

---

## Local Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **PostgreSQL Database:** Running locally or via a cloud provider (e.g., Supabase)

### Step 1: Clone the Repository
```bash
git clone https://github.com/AbhayMahalle/AquaNexus.git
cd AquaNexus
```

### Step 2: Configure & Start Backend
```bash
cd new_backend

# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL and JWT_SECRET

# 3. Synchronize database schema
npx prisma db push

# 4. (Optional) Open Prisma Studio to inspect database records
npx prisma studio

# 5. Start the backend development server
npm start
# Backend will run on http://localhost:5000
```

### Step 3: Configure & Start Frontend
Open a new terminal in the project root:

```bash
# 1. Install frontend dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Start the Vite development server
npm run dev
# Frontend will run on http://localhost:3000
```

### Step 4: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## Default Demo Credentials

For testing and local development, default role accounts are pre-configured:

| Role | Email / Username | Default Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@aquanexus.com` | `Abhay@123` | `/super-admin` |
| **Tenant Admin** | `apexadmin@gmail.com` | `Abhay@123` | `/admin` |
| **Manager** | `abhaymanager@gmail.com` | `Abhay@123` | `/manager` |
| **Store Manager** | `ramstore@gmail.com` | `Abhay@123` | `/store` |
| **Accountant** | `yashaccountant@gmail.com` | `Abhay@123` | `/accountant` |
| **Distributor** | `niranjandistributor@gmail.com` | `Abhay@123` | `/distributor` |
| **Supplier** | `herambsupplier@gmail.com` | `Abhay@123` | `/supplier` |

---

## API Endpoints Overview

All endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/login` — Authenticate user and issue JWT token
- `GET /api/auth/me` — Retrieve current authenticated profile and permissions

### Platform Super Admin
- `GET /api/platform/stats` — Overall platform statistics and MRR
- `GET /api/platform/companies` — List all onboarded organizations
- `POST /api/platform/companies` — Provision a new tenant organization
- `GET /api/platform/plans` — List and manage subscription tiers
- `POST /api/platform/subscriptions/assign` — Assign or change tenant plan tier
- `GET /api/platform/payments` — Retrieve recorded subscription payments

### Company Admin & Tenant
- `GET /api/company/subscription` — Current subscription, usage, and database plan catalog
- `GET /api/company/plans` — View all active database subscription plans
- `GET /api/production` — List production batches
- `POST /api/production` — Log new production run
- `GET /api/inventory` — Current inventory levels across SKUs
- `GET /api/orders` — Customer orders and dispatches
- `GET /api/employees` — Tenant employee master list

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/your-feature-name`).
2. Verify code quality:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
3. Commit changes using conventional commit messages (`git commit -m 'feat: add feature'`).
4. Push to your branch and open a Pull Request.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
