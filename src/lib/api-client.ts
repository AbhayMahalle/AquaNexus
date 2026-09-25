import {
  ApiResponse,
  Product,
  Order,
  OrderItem,
  DistributorStock,
  Sale,
  ProductReturn,
  Invoice,
  Payment,
  PayrollRecord,
  Expense,
  OutstandingSummary,
} from '@/types/business';
import { fetchApi } from '@/services/apiClient';

export const apiClient = {
  async getProducts(): Promise<ApiResponse<Product[]>> {
    const res = await fetchApi<{ products: any[] }>('/products?limit=100');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawList = res.data?.products || (Array.isArray(res.data) ? res.data : []);
    const products: Product[] = rawList.map((p: any) => {
      const stock = p.inventory?.quantity ?? p.availableStock ?? 0;
      const reorder = p.inventory?.reorderLevel ?? p.minimumStock ?? 50;
      let status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'AVAILABLE';
      if (stock <= 0) status = 'OUT_OF_STOCK';
      else if (stock <= reorder) status = 'LOW_STOCK';

      return {
        id: p.id,
        productCode: p.sku || p.productCode || p.id,
        name: p.name,
        category: p.category || 'Packaged Water',
        unit: p.unit || 'Bottle',
        unitPrice: Number(p.sellingPrice || p.unitPrice || 0),
        availableStock: stock,
        status,
      };
    });

    return { success: true, data: products, message: res.message };
  },

  async getDistributors(): Promise<ApiResponse<any[]>> {
    const res = await fetchApi<{ distributors: any[] }>('/distributors');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }
    const list = res.data?.distributors || (Array.isArray(res.data) ? res.data : []);
    return { success: true, data: list, message: res.message };
  },

  async getOrders(): Promise<ApiResponse<Order[]>> {
    const res = await fetchApi<{ orders: any[] }>('/orders');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawOrders = res.data?.orders || (Array.isArray(res.data) ? res.data : []);
    const orders: Order[] = rawOrders.map((o: any) => {
      const items: OrderItem[] = (o.orderItems || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name || 'Water Product',
        unit: i.product?.unit || 'Unit',
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice || 0),
        totalPrice: Number(i.total ?? i.totalPrice ?? (Number(i.unitPrice || 0) * i.quantity)),
      }));

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        distributorId: o.distributorId,
        distributorName: o.distributor?.name || 'Distributor Agency',
        orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
        status: o.status,
        items,
        subtotal: Number(o.subtotal || 0),
        taxAmount: Number(o.tax || 0),
        totalAmount: Number(o.totalAmount || 0),
        deliveryAddress: o.deliveryAddress || o.distributor?.address || 'Plant Dispatch Center',
        notes: o.notes || '',
        invoiceId: o.invoice?.id,
      };
    });

    return { success: true, data: orders, message: res.message };
  },

  async getOrderById(id: string): Promise<ApiResponse<Order | null>> {
    const res = await fetchApi<{ order: any }>(`/orders/${id}`);
    if (!res.success || !res.data) {
      return { success: false, data: null, message: res.message || 'Order not found' };
    }

    const o = res.data.order || res.data;
    const items: OrderItem[] = (o.orderItems || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product?.name || 'Water Product',
      unit: i.product?.unit || 'Unit',
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice || 0),
      totalPrice: Number(i.total ?? i.totalPrice ?? (Number(i.unitPrice || 0) * i.quantity)),
    }));

    const order: Order = {
      id: o.id,
      orderNumber: o.orderNumber,
      distributorId: o.distributorId,
      distributorName: o.distributor?.name || 'Distributor Agency',
      orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
      status: o.status,
      items,
      subtotal: Number(o.subtotal || 0),
      taxAmount: Number(o.tax || 0),
      totalAmount: Number(o.totalAmount || 0),
      deliveryAddress: o.deliveryAddress || o.distributor?.address || 'Plant Dispatch Center',
      notes: o.notes || '',
      invoiceId: o.invoice?.id,
    };

    return { success: true, data: order, message: res.message };
  },

  async createOrder(
    newOrder: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'items'> & {
      items: { productId: string; quantity: number }[];
    }
  ): Promise<ApiResponse<Order>> {
    const payload = {
      distributorId: newOrder.distributorId || undefined,
      orderDate: new Date().toISOString(),
      items: newOrder.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      notes: newOrder.notes,
    };

    const res = await fetchApi<{ order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as Order, message: res.message || 'Failed to create order' };
    }

    const o = res.data.order || res.data;
    const items: OrderItem[] = (o.orderItems || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product?.name || 'Water Product',
      unit: i.product?.unit || 'Unit',
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice || 0),
      totalPrice: Number(i.total ?? i.totalPrice ?? 0),
    }));

    const created: Order = {
      id: o.id,
      orderNumber: o.orderNumber,
      distributorId: o.distributorId,
      distributorName: o.distributor?.name || 'Distributor Agency',
      orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '',
      status: o.status,
      items,
      subtotal: Number(o.subtotal || 0),
      taxAmount: Number(o.tax || 0),
      totalAmount: Number(o.totalAmount || 0),
      deliveryAddress: o.deliveryAddress || newOrder.deliveryAddress || '',
      notes: o.notes || '',
    };

    return { success: true, data: created, message: 'Order created successfully' };
  },

  async getDistributorStock(): Promise<ApiResponse<DistributorStock[]>> {
    const res = await fetchApi<{ stock: any[] }>('/distributor-stock');
    if (res.success && res.data) {
      const rawList = res.data.stock || (Array.isArray(res.data) ? res.data : []);
      const stock: DistributorStock[] = rawList.map((s: any) => {
        const qty = Number(s.quantity ?? 0);
        const minThresh = Number(s.product?.minimumStock ?? 50);
        return {
          id: s.id,
          distributorId: s.distributorId,
          productId: s.productId,
          productName: s.product?.name || 'Packaged Drinking Water',
          unit: s.product?.unit || 'Bottle',
          quantity: qty,
          minThreshold: minThresh,
          status: qty <= 0 ? 'OUT_OF_STOCK' : qty <= minThresh ? 'LOW_STOCK' : 'AVAILABLE',
          lastUpdated: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        };
      });
      return { success: true, data: stock, message: res.message };
    }

    return { success: false, data: [], message: res.message || 'Failed to retrieve distributor stock' };
  },

  async getSales(): Promise<ApiResponse<Sale[]>> {
    const res = await fetchApi<{ sales: any[] }>('/sales');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawSales = res.data?.sales || (Array.isArray(res.data) ? res.data : []);
    const sales: Sale[] = rawSales.map((s: any) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      orderId: s.orderId,
      distributorId: s.distributorId || '',
      distributorName: s.distributor?.name || 'Distributor Agency',
      customerName: s.customerReference || 'Retail Store',
      saleDate: s.saleDate ? new Date(s.saleDate).toISOString().split('T')[0] : '',
      totalAmount: Number(s.totalAmount || 0),
      paymentStatus: (s.paymentStatus || (s.status === 'COMPLETED' ? 'PAID' : 'PENDING')) as Sale['paymentStatus'],
    }));

    return { success: true, data: sales, message: res.message };
  },

  async createSale(newSale: {
    distributorId?: string;
    customerReference?: string;
    items: { productId: string; quantity: number }[];
  }): Promise<ApiResponse<Sale>> {
    const payload = {
      saleNumber: `SAL-${Date.now().toString().slice(-6)}`,
      distributorId: newSale.distributorId,
      saleDate: new Date().toISOString(),
      customerReference: newSale.customerReference || 'Retail Store',
      items: newSale.items,
    };

    const res = await fetchApi<{ sale: any }>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as Sale, message: res.message || 'Failed to record sale' };
    }

    const s = res.data.sale || res.data;
    const created: Sale = {
      id: s.id,
      saleNumber: s.saleNumber,
      orderId: s.orderId,
      distributorId: s.distributorId,
      distributorName: s.distributor?.name || 'Distributor Agency',
      customerName: s.customerReference || 'Retail Store',
      saleDate: s.saleDate ? new Date(s.saleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalAmount: Number(s.totalAmount || 0),
      paymentStatus: 'PAID',
    };
    return { success: true, data: created, message: 'Sale recorded successfully' };
  },

  async getReturns(): Promise<ApiResponse<ProductReturn[]>> {
    const res = await fetchApi<{ returns: any[] }>('/returns');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawReturns = res.data?.returns || (Array.isArray(res.data) ? res.data : []);
    const returns: ProductReturn[] = rawReturns.map((r: any) => {
      const firstItem = r.returnItems?.[0];
      const prodNames = (r.returnItems || []).map((i: any) => i.product?.name).filter(Boolean).join(', ') || firstItem?.product?.name || 'Water Product';
      const totalQty = (r.returnItems || []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0);
      return {
        id: r.id,
        returnNumber: r.returnNumber,
        distributorId: r.distributorId,
        distributorName: r.distributor?.name || 'Distributor Agency',
        productId: firstItem?.productId || '',
        productName: prodNames,
        quantity: totalQty || firstItem?.quantity || 0,
        returnDate: r.returnDate ? new Date(r.returnDate).toISOString().split('T')[0] : '',
        reason: r.reason || (firstItem?.condition === 'GOOD' ? 'EXCESS' : 'DAMAGED'),
        status: (r.status === 'RECEIVED' || r.status === 'APPROVED') ? 'APPROVED' : r.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        refundAmount: Number(r.refundAmount || 0),
      };
    });

    return { success: true, data: returns, message: res.message };
  },

  async createReturn(newReturn: {
    distributorId?: string;
    distributorName?: string;
    productId: string;
    productName?: string;
    quantity: number;
    reason: string;
    condition?: 'DAMAGED' | 'GOOD';
  }): Promise<ApiResponse<ProductReturn>> {
    const payload = {
      returnNumber: `RET-${Date.now().toString().slice(-6)}`,
      distributorId: newReturn.distributorId,
      returnDate: new Date().toISOString(),
      reason: newReturn.reason,
      items: [
        {
          productId: newReturn.productId,
          quantity: Number(newReturn.quantity),
          condition: newReturn.condition || 'DAMAGED',
          remarks: newReturn.reason,
        },
      ],
    };

    const res = await fetchApi<{ return: any }>('/returns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as ProductReturn, message: res.message || 'Failed to submit return' };
    }

    const r = res.data.return || res.data;
    const created: ProductReturn = {
      id: r.id,
      returnNumber: r.returnNumber,
      distributorId: r.distributorId,
      distributorName: newReturn.distributorName || 'Distributor Agency',
      productId: newReturn.productId,
      productName: newReturn.productName || 'Water Product',
      quantity: newReturn.quantity,
      returnDate: new Date().toISOString().split('T')[0],
      reason: (newReturn.reason as ProductReturn['reason']) || 'DAMAGED',
      status: 'PENDING',
      refundAmount: 0,
    };

    return { success: true, data: created, message: 'Return submitted successfully' };
  },

  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    const res = await fetchApi<{ invoices: any[] }>('/invoices');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawInvoices = res.data?.invoices || (Array.isArray(res.data) ? res.data : []);
    const invoices: Invoice[] = rawInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      orderId: inv.orderId,
      orderNumber: inv.order?.orderNumber || `ORD-${inv.orderId?.slice(0, 6) || '001'}`,
      distributorId: inv.distributorId,
      distributorName: inv.distributor?.name || 'Distributor Agency',
      issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      subtotal: Number(inv.subtotal || 0),
      taxAmount: Number(inv.tax || 0),
      totalAmount: Number(inv.totalAmount || 0),
      paidAmount: Number(inv.paidAmount || 0),
      outstandingAmount: Number(inv.outstandingAmount ?? Math.max(0, Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0))),
      status: (inv.status === 'PAID' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') ? inv.status : 'PENDING',
    }));

    return { success: true, data: invoices, message: res.message };
  },

  async getPayments(): Promise<ApiResponse<Payment[]>> {
    const res = await fetchApi<{ payments: any[] }>('/payments');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawPayments = res.data?.payments || (Array.isArray(res.data) ? res.data : []);
    const payments: Payment[] = rawPayments.map((p: any) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      invoiceId: p.invoiceId,
      invoiceNumber: p.invoice?.invoiceNumber || '',
      referenceId: p.referenceNumber || p.id,
      payerName: p.invoice?.distributor?.name || 'Distributor Agency',
      paymentType: 'DISTRIBUTOR_PAYMENT',
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '',
      amount: Number(p.amount || 0),
      paymentMethod: p.paymentMethod || 'BANK_TRANSFER',
      status: p.status === 'COMPLETED' ? 'PAID' : (p.status || 'PENDING'),
      notes: p.remarks || '',
    }));

    return { success: true, data: payments, message: res.message };
  },

  async recordPayment(paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'paymentDate' | 'status'>): Promise<ApiResponse<Payment>> {
    const payload = {
      paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
      invoiceId: paymentData.invoiceId,
      amount: Number(paymentData.amount),
      paymentDate: new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: paymentData.referenceId || `TXN-${Date.now().toString().slice(-6)}`,
      remarks: paymentData.notes || 'Payment processed',
    };

    const res = await fetchApi<{ payment: any }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as Payment, message: res.message || 'Failed to record payment' };
    }

    const p = res.data.payment || res.data;
    const created: Payment = {
      id: p.id,
      paymentNumber: p.paymentNumber,
      invoiceId: p.invoiceId,
      invoiceNumber: paymentData.invoiceNumber || '',
      referenceId: p.referenceNumber || paymentData.referenceId,
      payerName: paymentData.payerName || 'Distributor Agency',
      paymentType: paymentData.paymentType || 'DISTRIBUTOR_PAYMENT',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: 'PAID',
      notes: p.remarks,
    };

    return { success: true, data: created, message: 'Payment recorded successfully' };
  },

  async getPayroll(): Promise<ApiResponse<PayrollRecord[]>> {
    const res = await fetchApi<{ payroll: any[] }>('/payroll');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawPayroll = res.data?.payroll || (Array.isArray(res.data) ? res.data : []);
    const payroll: PayrollRecord[] = rawPayroll.map((p: any) => ({
      id: p.id,
      employeeId: p.employee?.employeeCode || p.employeeId,
      employeeName: `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() || 'Employee',
      department: p.employee?.department?.name || 'Plant Operations',
      designation: p.employee?.designation || 'Staff',
      payPeriod: p.payPeriodStart ? new Date(p.payPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Current Month',
      baseSalary: Number(p.basicSalary || 0),
      overtimeHours: 0,
      overtimePay: Number(p.overtimeAmount || 0),
      deductions: Number(p.deductions || 0),
      netSalary: Number(p.netSalary || 0),
      status: p.status,
    }));

    return { success: true, data: payroll, message: res.message };
  },

  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    const res = await fetchApi<{ expenses: any[] }>('/expenses');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }

    const rawExpenses = res.data?.expenses || (Array.isArray(res.data) ? res.data : []);
    const expenses: Expense[] = rawExpenses.map((e: any) => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      category: e.category,
      description: e.description || '',
      amount: Number(e.amount || 0),
      expenseDate: e.expenseDate ? new Date(e.expenseDate).toISOString().split('T')[0] : '',
      createdBy: `${e.creator?.firstName || ''} ${e.creator?.lastName || ''}`.trim() || 'Accountant',
      status: e.status,
    }));

    return { success: true, data: expenses, message: res.message };
  },

  async getSuppliers(): Promise<ApiResponse<any[]>> {
    const res = await fetchApi<{ suppliers: any[] }>('/suppliers');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }
    const suppliers = res.data?.suppliers || (Array.isArray(res.data) ? res.data : []);
    return { success: true, data: suppliers, message: res.message };
  },

  async updatePayrollStatus(id: string, status: 'DRAFT' | 'PROCESSED' | 'PAID'): Promise<ApiResponse<PayrollRecord>> {
    const res = await fetchApi<{ payroll: any }>(`/payroll/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as PayrollRecord, message: res.message || 'Failed to update payroll' };
    }

    const p = res.data.payroll || res.data;
    const updated: PayrollRecord = {
      id: p.id,
      employeeId: p.employee?.employeeCode || p.employeeId,
      employeeName: `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() || 'Employee',
      department: p.employee?.department?.name || 'Plant Operations',
      designation: p.employee?.designation || 'Staff',
      payPeriod: p.payPeriodStart ? new Date(p.payPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Current Month',
      baseSalary: Number(p.basicSalary || 0),
      overtimeHours: 0,
      overtimePay: Number(p.overtimeAmount || 0),
      deductions: Number(p.deductions || 0),
      netSalary: Number(p.netSalary || 0),
      status: p.status,
      paidDate: p.processedAt ? new Date(p.processedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };

    return { success: true, data: updated, message: 'Payroll status updated successfully' };
  },

  async createPayroll(data: {
    employeeId: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    basicSalary: number;
    overtimeAmount?: number;
    deductions?: number;
    status?: 'DRAFT' | 'PROCESSED' | 'PAID';
  }): Promise<ApiResponse<PayrollRecord>> {
    const res = await fetchApi<{ payroll: any }>('/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as PayrollRecord, message: res.message || 'Failed to create payroll' };
    }

    const p = res.data.payroll || res.data;
    const created: PayrollRecord = {
      id: p.id,
      employeeId: p.employee?.employeeCode || p.employeeId,
      employeeName: `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() || 'Employee',
      department: p.employee?.department?.name || 'Plant Operations',
      designation: p.employee?.designation || 'Staff',
      payPeriod: p.payPeriodStart ? new Date(p.payPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Current Month',
      baseSalary: Number(p.basicSalary || 0),
      overtimeHours: 0,
      overtimePay: Number(p.overtimeAmount || 0),
      deductions: Number(p.deductions || 0),
      netSalary: Number(p.netSalary || 0),
      status: p.status,
    };

    return { success: true, data: created, message: 'Payroll record created successfully' };
  },

  async addExpense(expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'expenseDate' | 'status'> & { supplierId?: string }): Promise<ApiResponse<Expense>> {
    const payload = {
      expenseNumber: `EXP-${Date.now().toString().slice(-6)}`,
      category: expenseData.category,
      amount: Number(expenseData.amount),
      expenseDate: new Date().toISOString(),
      description: expenseData.description,
      supplierId: expenseData.supplierId,
    };

    const res = await fetchApi<{ expense: any }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success || !res.data) {
      return { success: false, data: null as unknown as Expense, message: res.message || 'Failed to add expense' };
    }

    const e = res.data.expense || res.data;
    const created: Expense = {
      id: e.id,
      expenseNumber: e.expenseNumber,
      category: e.category,
      description: e.description,
      amount: Number(e.amount),
      expenseDate: new Date().toISOString().split('T')[0],
      createdBy: 'You',
      status: e.status || 'PAID',
    };

    return { success: true, data: created, message: 'Expense added successfully' };
  },

  async getOutstandingSummary(): Promise<ApiResponse<OutstandingSummary>> {
    const [invRes, distRes, expRes] = await Promise.all([
      this.getInvoices(),
      this.getDistributors(),
      this.getExpenses(),
    ]);

    const invoices = invRes.data || [];
    const distributors = distRes.data || [];
    const expenses = expRes.data || [];

    const totalDistributorOutstanding = invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);
    const totalSupplierOutstanding = expenses
      .filter((e) => e.status !== 'PAID')
      .reduce((acc, e) => acc + e.amount, 0);

    const overdueCount = invoices.filter(
      (i) => i.status === 'OVERDUE' || (new Date(i.dueDate).getTime() < Date.now() && (i.outstandingAmount || 0) > 0)
    ).length;

    const distMap = new Map<string, any>();
    for (const d of distributors) {
      distMap.set(d.id, {
        id: `db-${d.id}`,
        distributorId: d.id,
        distributorName: d.name,
        salesArea: (d as any).salesArea?.name || 'Regional Territory',
        invoiceCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        overdueDays: 0,
      });
    }

    for (const inv of invoices) {
      const key = inv.distributorId || 'other';
      if (!distMap.has(key)) {
        distMap.set(key, {
          id: `db-${key}`,
          distributorId: inv.distributorId,
          distributorName: inv.distributorName,
          salesArea: 'Regional Territory',
          invoiceCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          overdueDays: 0,
        });
      }
      const entry = distMap.get(key);
      entry.invoiceCount += 1;
      entry.totalAmount += inv.totalAmount;
      entry.paidAmount += inv.paidAmount;
      entry.outstandingAmount += inv.outstandingAmount;
      if (new Date(inv.dueDate).getTime() < Date.now() && (inv.outstandingAmount || 0) > 0) {
        const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > entry.overdueDays) entry.overdueDays = days;
      }
    }

    return {
      success: true,
      data: {
        totalDistributorOutstanding,
        totalSupplierOutstanding,
        overdueCount,
        distributorBalances: Array.from(distMap.values()),
      },
      message: 'Outstanding financial data retrieved',
    };
  },

  async getEmployees(): Promise<ApiResponse<any[]>> {
    const res = await fetchApi<{ employees: any[] }>('/employees');
    if (!res.success) {
      return { success: false, data: [], message: res.message };
    }
    const employees = res.data?.employees || (Array.isArray(res.data) ? res.data : []);
    return { success: true, data: employees, message: res.message };
  },
};