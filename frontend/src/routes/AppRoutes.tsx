import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '@/pages/Home';

/* Distributor Pages */
import { DistributorDashboard } from '@/pages/distributor/Dashboard';
import { DistributorProducts } from '@/pages/distributor/Products';
import { DistributorOrders } from '@/pages/distributor/Orders';
import { CreateOrder } from '@/pages/distributor/CreateOrder';
import { OrderDetails } from '@/pages/distributor/OrderDetails';
import { DistributorStockPage } from '@/pages/distributor/Stock';
import { DistributorSales } from '@/pages/distributor/Sales';
import { DistributorReturns } from '@/pages/distributor/Returns';
import { DistributorInvoices } from '@/pages/distributor/Invoices';
import { DistributorPayments } from '@/pages/distributor/Payments';
import { DistributorOutstanding } from '@/pages/distributor/Outstanding';

/* Accountant Pages */
import { AccountantDashboard } from '@/pages/accountant/Dashboard';
import { AccountantPayroll } from '@/pages/accountant/Payroll';
import { AccountantPayments } from '@/pages/accountant/Payments';
import { AccountantExpenses } from '@/pages/accountant/Expenses';
import { AccountantOutstanding } from '@/pages/accountant/Outstanding';
import { AccountantReports } from '@/pages/accountant/Reports';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Portal */}
      <Route path="/" element={<Home />} />

      {/* Distributor Routes */}
      <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
      <Route path="/distributor/products" element={<DistributorProducts />} />
      <Route path="/distributor/orders" element={<DistributorOrders />} />
      <Route path="/distributor/orders/create" element={<CreateOrder />} />
      <Route path="/distributor/orders/:id" element={<OrderDetails />} />
      <Route path="/distributor/stock" element={<DistributorStockPage />} />
      <Route path="/distributor/sales" element={<DistributorSales />} />
      <Route path="/distributor/returns" element={<DistributorReturns />} />
      <Route path="/distributor/invoices" element={<DistributorInvoices />} />
      <Route path="/distributor/payments" element={<DistributorPayments />} />
      <Route path="/distributor/outstanding" element={<DistributorOutstanding />} />

      {/* Accountant Routes */}
      <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
      <Route path="/accountant/payroll" element={<AccountantPayroll />} />
      <Route path="/accountant/payments" element={<AccountantPayments />} />
      <Route path="/accountant/expenses" element={<AccountantExpenses />} />
      <Route path="/accountant/outstanding" element={<AccountantOutstanding />} />
      <Route path="/accountant/reports" element={<AccountantReports />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
