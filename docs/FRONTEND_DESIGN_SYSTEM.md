# FRONTEND DESIGN SYSTEM — WATER PLANT MANAGEMENT SYSTEM (AQUANEXUS)

This document specifies the exact, non-negotiable frontend design system to be shared across all 4 frontend developers (Mrudula, Niranjan, Ram, Yash).

---

## 1. Role Identification
- **User Role**: **Yash**
- **Responsibilities**: Distributor + Accountant Frontend Modules
- **Pages Owned**:
  - **Distributor**: `/distributor/dashboard`, `/distributor/products`, `/distributor/orders`, `/distributor/orders/create`, `/distributor/orders/[id]`, `/distributor/stock`, `/distributor/sales`, `/distributor/returns`, `/distributor/invoices`, `/distributor/payments`, `/distributor/outstanding`
  - **Accountant**: `/accountant/dashboard`, `/accountant/payroll`, `/accountant/payments`, `/accountant/overtime`, `/accountant/deductions`, `/accountant/distributor-payments`, `/accountant/supplier-payments`, `/accountant/expenses`, `/accountant/outstanding`, `/accountant/reports`
- **Backend Partner**: Heramb (Distribution + Finance Backend)

---

## 2. Color System Tokens

```css
/* Color Palette */
--color-primary: #0F4C81;      /* Deep Water Blue */
--color-secondary: #1597D4;    /* Aqua Blue */
--color-accent: #22B8CF;       /* Cyan */

--color-bg-main: #F5F8FB;      /* Main Application Background */
--color-bg-surface: #FFFFFF;   /* Card & Container Background */

--color-text-primary: #172033; /* Primary Body & Header Text */
--color-text-secondary: #64748B;/* Secondary / Label Text */
--color-text-muted: #94A3B8;   /* Muted / Placeholder Text */

--color-border: #E2E8F0;       /* Divider & Box Border */

/* Semantic Status Colors */
--color-success: #16A34A;      /* Green */
--color-warning: #F59E0B;      /* Amber / Orange */
--color-danger: #DC2626;       /* Red */
--color-info: #2563EB;         /* Blue */
```

---

## 3. Typography Tokens (Font: Inter)

- **Page Title**: `24px`, font-weight `700`
- **Section Title**: `18px`, font-weight `600`
- **Card Title**: `15-16px`, font-weight `600`
- **Body Text**: `14px`, font-weight `400`
- **Secondary Text**: `13px`, font-weight `400`
- **Small Metadata**: `12px`
- **KPI / Large Numbers**: `24-30px`, font-weight `700`

---

## 4. Border Radius & Shadow Tokens

### Radius
- **Small** (`rounded-md`): `6px` (Inputs, Badges, Small buttons)
- **Default** (`rounded-lg`): `8px` (Buttons, Dropdowns)
- **Cards** (`rounded-xl`): `12px` (KPI Cards, Tables, Standard Containers)
- **Large** (`rounded-2xl`): `14px` (Modals, Large Layout Containers)
- **Pill** (`rounded-full`): Status badges & tags only

### Shadows
- **Card Shadow**: `0 1px 3px rgba(15, 23, 42, 0.06)`
- **Hover Shadow**: `0 4px 12px rgba(15, 23, 42, 0.08)`

---

## 5. Technical Component Architecture

```
frontend/
├── src/                      # React (Vite + React Router DOM)
│   ├── pages/
│   │   ├── auth/Login.tsx
│   │   ├── admin/            # Mrudula
│   │   ├── manager/          # Mrudula
│   │   ├── store/            # Ram
│   │   ├── distributor/      # Yash
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── CreateOrder.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   ├── Stock.tsx
│   │   │   ├── Sales.tsx
│   │   │   ├── Returns.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── Payments.tsx
│   │   │   └── Outstanding.tsx
│   │   ├── accountant/       # Yash
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Payroll.tsx
│   │   │   ├── Payments.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Outstanding.tsx
│   │   │   └── Reports.tsx
│   │   ├── employees/        # Niranjan
│   │   └── production/       # Niranjan
│   │
│   ├── components/
│   │   ├── ui/               # Shared UI Primitives (Button, Card, Input, Table, etc.)
│   │   ├── layout/           # Shared Layout Shells (Sidebar, Topbar, DashboardLayout)
│   │   └── charts/           # Shared Recharts Wrappers
│   └── routes/               # App Router configuration (react-router-dom)
```

---

## 6. Strict Development Rules for Yash (Distributor & Accountant)

1. Use **Lucide React** icons exclusively (`18px` default icon size).
2. Reuse shared components from `components/ui/`, `components/layout/`, and `components/charts/`.
3. Page layouts follow: **PageHeader → Search/Filters → Main Content (KPIs/Table/Grid)**.
4. Smooth page transitions: `opacity 0 -> 1` and `translateY 4px -> 0` (~200ms).
5. All mock/API integration data formatting follows standard status badges and numeric representations.
6. Do not introduce custom colors, gradients, or separate visual themes for Distributor or Accountant pages.
