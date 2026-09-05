import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import LoginPage from '@/pages/Login';
import FoundationTestPage from '@/pages/FoundationTest';

import {
  StoreDashboardPage,
  InventoryListPage,
  InventoryDetailPage,
  StockInPage,
  StockOutPage,
  GoodsReceivedPage,
  DispatchPage,
  ReturnsPage,
  DamagedGoodsPage,
  LowStockAlertsPage,
  StoreReportsPage,
} from '@/pages/store';

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'store_manager') {
    return <Navigate to="/store/dashboard" replace />;
  }

  return <Navigate to="/store/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* RAM Store & Inventory Module Routes */}
      <Route path="/store/dashboard" element={<StoreDashboardPage />} />
      <Route path="/store/inventory" element={<InventoryListPage />} />
      <Route path="/store/inventory/:id" element={<InventoryDetailPage />} />
      <Route path="/store/stock-in" element={<StockInPage />} />
      <Route path="/store/stock-out" element={<StockOutPage />} />
      <Route path="/store/goods-received" element={<GoodsReceivedPage />} />
      <Route path="/store/dispatch" element={<DispatchPage />} />
      <Route path="/store/returns" element={<ReturnsPage />} />
      <Route path="/store/damaged" element={<DamagedGoodsPage />} />
      <Route path="/store/low-stock" element={<LowStockAlertsPage />} />
      <Route path="/store/reports" element={<StoreReportsPage />} />

      {/* Shared Foundation Test Route */}
      <Route path="/foundation-test" element={<FoundationTestPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
