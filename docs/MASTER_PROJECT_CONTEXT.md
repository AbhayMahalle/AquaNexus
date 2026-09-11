# MASTER PROJECT CONTEXT — WATER PLANT MANAGEMENT SYSTEM

This document is the SINGLE SOURCE OF TRUTH for the Water Plant Management System (AquaNexus).

## 1. Project Objective
Centralized management system for a water plant connecting Employees, Production, Store/Inventory, Distributor, Orders/Sales, Invoices/Payments, Finance/Payroll/Expenses, and Reports.

## 2. Project Type
Role-based ERP-style system:
- **One Application** (Next.js frontend, Node.js/Express.js backend, SQL Database)
- **5 Roles**: Admin, Manager, Store Manager, Accountant, Distributor
- **Employees**: Business entities only (no login/dashboard).

## 3. Tech Stack
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS, Lucide React icons)
- **Backend**: Node.js + Express.js (REST API, SQL access layer, JWT/Session Auth, RBAC middleware)
- **Database**: SQL Relational Database

## 4. Core Business Model
- **Production → Store Receipt → Store Inventory → Dispatch → Distributor Stock → Orders → Sales → Invoice → Payment → Outstanding Amount**
- **Employee → Attendance → Leave → Overtime → Payroll → Salary Payment**
- **Supplier → Purchase → Supplier Payment**
- **Expense → Financial Reporting**

## 5. Team Responsibilities & Ownership

### Frontend Team (Next.js)
1. **Mrudula**: Admin + Manager Frontend (`/admin/*`, `/manager/*`, Layouts, Shared Dashboard Shell)
2. **Niranjan**: Employee + Attendance + Leave + Overtime + Production (`/employees/*`, `/attendance/*`, `/leave/*`, `/overtime/*`, `/production/*`)
3. **Ram**: Store + Inventory (`/store/*`)
4. **Yash**: Distributor + Accountant (`/distributor/*`, `/accountant/*`)

### Backend Team (Node.js + Express.js + SQL)
1. **Abhay (Lead)**: Core, Auth, Users, Roles, Permissions, Manager Assignments (`/api/auth/*`, `/api/users/*`, `/api/roles/*`, `/api/permissions/*`, `/api/manager-assignments/*`, `/api/admin/*`, `/api/dashboard/*`)
2. **Krishna**: Operations Backend (`/api/employees/*`, `/api/attendance/*`, `/api/leave/*`, `/api/overtime/*`, `/api/production/*`, `/api/products/*`, `/api/inventory/*`, `/api/stock-transactions/*`, `/api/goods-received/*`, `/api/returns/*`, `/api/damaged-goods/*`)
3. **Heramb**: Distribution + Finance Backend (`/api/distributors/*`, `/api/sales-areas/*`, `/api/distributor-stock/*`, `/api/dispatch/*`, `/api/orders/*`, `/api/sales/*`, `/api/invoices/*`, `/api/payments/*`, `/api/suppliers/*`, `/api/expenses/*`, `/api/payroll/*`, `/api/outstanding/*`, `/api/financial-reports/*`)

## 6. Manager Assignment System
- Manager access = **Role + Assigned Operational Areas (PRODUCTION, STORE, DISTRIBUTION) + Permissions**.
- Manager dashboard must dynamically display only assigned modules.

## 7. Global Design Tokens
- **Primary**: `#0F4C81`
- **Secondary**: `#1597D4`
- **Accent**: `#22B8CF`
- **Background**: `#F5F8FB`
- **Surface**: `#FFFFFF`
- **Text**: Primary `#172033`, Secondary `#64748B`, Muted `#94A3B8`
- **Border**: `#E2E8F0`
- **Status**: Success `#16A34A`, Warning `#F5E90B` / `#F59E0B`, Danger `#DC2626`, Info `#2563EB`
- **Font**: Inter
- **Icons**: Lucide React only

## 8. API Standard Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```
Error format:
```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

## 9. Key Architectural Rules
1. Stock movements must be transaction-oriented (`stock_transactions`).
2. Backend enforces authentication and authorization on all protected routes.
3. Centralized inventory and distributor stock are separate entities.
4. No fake frontend data once API integration begins.
5. All dashboards use the same unified visual system.
