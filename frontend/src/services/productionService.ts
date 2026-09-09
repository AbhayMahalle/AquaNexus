import type { Production, Product, ApiResponse } from '../types';
import { fetchApi } from './apiClient';

const TODAY = new Date().toISOString().split('T')[0];

export const PLANT_PRODUCTS: Product[] = [
  { id: 'prod-1', productId: 'PRD-20L', name: '20L Reusable Water Jar', category: 'Commercial Jar', unit: 'JARS', unitPrice: 80 },
  { id: 'prod-2', productId: 'PRD-1L', name: '1L Mineral Water Bottle (Pack of 12)', category: 'Retail Pack', unit: 'PACKS', unitPrice: 180 },
  { id: 'prod-3', productId: 'PRD-500ML', name: '500ml Water Bottle (Pack of 24)', category: 'Retail Pack', unit: 'PACKS', unitPrice: 220 },
  { id: 'prod-4', productId: 'PRD-5L', name: '5L Dispenser Water Bottle', category: 'Home Jar', unit: 'BOTTLES', unitPrice: 95 },
];

const MOCK_PRODUCTION_BATCHES: Production[] = [
  {
    id: 'batch-1',
    batchNumber: 'BATCH-2026-0909-01',
    productId: 'PRD-20L',
    productName: '20L Reusable Water Jar',
    quantityProduced: 1250,
    unit: 'JARS',
    productionDate: TODAY,
    shift: 'MORNING',
    supervisor: 'Suresh Kumar',
    status: 'COMPLETED',
    goodsReceivedStatus: 'RECEIVED',
    notes: 'RO Filtration line 1 operational. TDS: 45 ppm, pH: 7.2',
  },
  {
    id: 'batch-2',
    batchNumber: 'BATCH-2026-0909-02',
    productId: 'PRD-1L',
    productName: '1L Mineral Water Bottle (Pack of 12)',
    quantityProduced: 800,
    unit: 'PACKS',
    productionDate: TODAY,
    shift: 'MORNING',
    supervisor: 'Suresh Kumar',
    status: 'IN_PROGRESS',
    goodsReceivedStatus: 'PENDING',
    notes: 'Automatic bottling and shrink packaging line',
  },
  {
    id: 'batch-3',
    batchNumber: 'BATCH-2026-0908-01',
    productId: 'PRD-500ML',
    productName: '500ml Water Bottle (Pack of 24)',
    quantityProduced: 650,
    unit: 'PACKS',
    productionDate: '2026-09-08',
    shift: 'AFTERNOON',
    supervisor: 'Vikram Jadhav',
    status: 'COMPLETED',
    goodsReceivedStatus: 'RECEIVED',
    notes: 'Transferred to Central Store inventory',
  },
  {
    id: 'batch-4',
    batchNumber: 'BATCH-2026-0907-02',
    productId: 'PRD-5L',
    productName: '5L Dispenser Water Bottle',
    quantityProduced: 400,
    unit: 'BOTTLES',
    productionDate: '2026-09-07',
    shift: 'NIGHT',
    supervisor: 'Suresh Kumar',
    status: 'COMPLETED',
    goodsReceivedStatus: 'RECEIVED',
    notes: 'Full quality check passed',
  },
];

let localProduction: Production[] = [...MOCK_PRODUCTION_BATCHES];

export const productionService = {
  async getProducts(): Promise<ApiResponse<Product[]>> {
    const realResponse = await fetchApi<Product[]>('/products');
    if (realResponse.success && Array.isArray(realResponse.data)) {
      return realResponse;
    }
    return { success: true, data: PLANT_PRODUCTS, message: 'Products list fetched' };
  },

  async getProductionBatches(params?: { status?: string; search?: string }): Promise<ApiResponse<Production[]>> {
    const realResponse = await fetchApi<Production[]>('/production');
    if (realResponse.success && Array.isArray(realResponse.data)) {
      return realResponse;
    }

    let result = [...localProduction];
    if (params?.status && params.status !== 'ALL') {
      result = result.filter((p) => p.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.batchNumber.toLowerCase().includes(q) ||
          p.productName.toLowerCase().includes(q) ||
          p.supervisor.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: result,
      message: 'Production batches fetched',
    };
  },

  async getProductionById(id: string): Promise<ApiResponse<Production>> {
    const realResponse = await fetchApi<Production>(`/production/${id}`);
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const batch = localProduction.find((p) => p.id === id || p.batchNumber === id);
    if (!batch) {
      return { success: false, data: null as unknown as Production, message: 'Batch not found' };
    }
    return { success: true, data: batch, message: 'Production details fetched' };
  },

  async createProductionBatch(batchData: Omit<Production, 'id' | 'batchNumber' | 'goodsReceivedStatus'>): Promise<ApiResponse<Production>> {
    const realResponse = await fetchApi<Production>('/production', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const dateStr = batchData.productionDate.replace(/-/g, '');
    const seq = localProduction.length + 1;
    const batchNumber = `BATCH-${dateStr}-${seq.toString().padStart(2, '0')}`;

    const newBatch: Production = {
      ...batchData,
      id: `prod-${Date.now()}`,
      batchNumber,
      goodsReceivedStatus: 'PENDING',
    };

    localProduction.unshift(newBatch);
    return { success: true, data: newBatch, message: 'Production batch created successfully' };
  },

  async updateProductionStatus(id: string, status: Production['status']): Promise<ApiResponse<Production>> {
    const realResponse = await fetchApi<Production>(`/production/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const idx = localProduction.findIndex((p) => p.id === id || p.batchNumber === id);
    if (idx === -1) {
      return { success: false, data: null as unknown as Production, message: 'Batch not found' };
    }

    localProduction[idx] = { ...localProduction[idx], status };
    return { success: true, data: localProduction[idx], message: `Batch status updated to ${status}` };
  },
};
