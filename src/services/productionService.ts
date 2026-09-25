import type { Production, Product, ApiResponse } from '@/types';
import { fetchApi } from './apiClient';

const TODAY = new Date().toISOString().split('T')[0];

export const PLANT_PRODUCTS: Product[] = [
  { id: '1b896933-2fc5-498c-850f-e6ce1434918f', productId: 'WB-20L', name: '20 Litre Water Bottle', category: 'Bottled Water', unit: 'Bottle', unitPrice: 40 },
  { id: '53569106-1bc8-43d9-9ae1-b76543b5930e', productId: 'WB-1L', name: '1 Litre Water Bottle', category: 'Bottled Water', unit: 'Bottle', unitPrice: 20 },
  { id: 'ca78c66e-c5e3-4d44-a0fe-4eec49a0f023', productId: 'WB-500ML', name: '500ml Water Bottle', category: 'Bottled Water', unit: 'Bottle', unitPrice: 10 },
  { id: '4076f874-9ae5-4ff1-b844-3d987d605eb8', productId: 'WB-250ML', name: '250ml Water Cup', category: 'Cups', unit: 'Cup', unitPrice: 5 },
];

function mapProduction(p: any): Production {
  return {
    id: p.id,
    batchNumber: p.batchNumber || p.productionNumber || `BATCH-${p.id.slice(-6)}`,
    productId: p.productId || p.product?.id || '',
    productName: p.product?.name || 'Water Product',
    quantityProduced: Number(p.quantity || 0),
    unit: p.product?.unit || 'Units',
    productionDate: p.productionDate ? new Date(p.productionDate).toISOString().split('T')[0] : TODAY,
    shift: 'MORNING',
    supervisor: p.creator ? `${p.creator.firstName || ''} ${p.creator.lastName || ''}`.trim() : 'Plant Manager',
    status: p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'CANCELLED',
    goodsReceivedStatus: p.totalReceived >= p.quantity ? 'RECEIVED' : 'PENDING',
    notes: p.remarks || '',
  };
}

export const productionService = {
  async getProducts(): Promise<ApiResponse<Product[]>> {
    const res = await fetchApi<{ products: any[] }>('/products');
    if (res.success && res.data) {
      const raw = res.data.products || (Array.isArray(res.data) ? res.data : []);
      const products: Product[] = raw.map((p: any) => ({
        id: p.id,
        productId: p.sku || p.id,
        name: p.name,
        category: p.category || 'Bottled Water',
        unit: p.unit || 'Bottle',
        unitPrice: Number(p.sellingPrice || 0),
      }));
      return { success: true, data: products, message: res.message || 'Products retrieved' };
    }
    return { success: false, data: [], message: res.message || 'Failed to retrieve products' };
  },

  async getProductionBatches(params?: { status?: string; search?: string }): Promise<ApiResponse<Production[]>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    query.append('limit', '50');

    const realResponse = await fetchApi<{ productions: any[]; pagination: any }>(`/production?${query.toString()}`);
    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.productions || (Array.isArray(realResponse.data) ? realResponse.data : []);
      const result = rawList.map(mapProduction);

      return {
        success: true,
        data: result,
        message: realResponse.message || 'Production batches fetched',
        pagination: realResponse.data.pagination,
      };
    }

    return {
      success: false,
      data: [],
      message: realResponse.message || 'Failed to fetch production batches',
    };
  },

  async getProductionById(id: string): Promise<ApiResponse<Production>> {
    const realResponse = await fetchApi<any>(`/production/${id}`);
    if (realResponse.success && realResponse.data) {
      const p = realResponse.data.production || realResponse.data;
      return {
        success: true,
        data: mapProduction(p),
        message: realResponse.message || 'Production details fetched',
      };
    }

    return {
      success: false,
      data: null as unknown as Production,
      message: realResponse.message || 'Production batch not found',
    };
  },

  async createProductionBatch(
    batchData: Omit<Production, 'id' | 'goodsReceivedStatus'>
  ): Promise<ApiResponse<Production>> {
    const payload = {
      productionNumber: `PRD-${Date.now().toString().slice(-6)}`,
      productId: batchData.productId,
      quantity: Number(batchData.quantityProduced),
      productionDate: new Date(batchData.productionDate || TODAY).toISOString(),
      batchNumber: batchData.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      remarks: batchData.notes,
      status: batchData.status || 'IN_PROGRESS',
    };

    const realResponse = await fetchApi<any>('/production', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const created = realResponse.data.production || realResponse.data;
      return {
        success: true,
        data: mapProduction(created),
        message: realResponse.message || 'Production batch created successfully',
      };
    }

    return {
      success: false,
      data: null as unknown as Production,
      message: realResponse.message || 'Failed to create production batch',
    };
  },

  async updateProductionStatus(id: string, status: Production['status']): Promise<ApiResponse<Production>> {
    const realResponse = await fetchApi<any>(`/production/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (realResponse.success && realResponse.data) {
      const updated = realResponse.data.production || realResponse.data;
      return {
        success: true,
        data: mapProduction(updated),
        message: realResponse.message || `Production status updated to ${status}`,
      };
    }

    return {
      success: false,
      data: null as unknown as Production,
      message: realResponse.message || 'Failed to update production status',
    };
  },
};
