import { fetchApi } from './apiClient';
import type { OrderStatus } from '@/types/business';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  distributorId: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  distributor?: {
    name: string;
    agencyName: string;
    route: string;
  };
  orderItems?: OrderItem[];
}

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const res = await fetchApi<{ orders: Order[] }>('/orders');
    return res.data?.orders || [];
  },

  getOrderById: async (id: string): Promise<Order> => {
    const res = await fetchApi<{ order: Order }>(`/orders/${id}`);
    return res.data?.order as Order;
  },

  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const res = await fetchApi<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data?.order as Order;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await fetchApi<{ order: Order }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.data?.order as Order;
  }
};
