export type RequisitionStatus =
  | 'DRAFT'
  | 'PENDING_RATE_APPROVAL'
  | 'RATES_FINALIZED'
  | 'REJECTED'
  | 'PO_ISSUED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PurchaseOrderStatus =
  | 'ISSUED'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_REJECTED'
  | 'CHALLAN_CREATED'
  | 'OUT_FOR_DELIVERY'
  | 'GOODS_RECEIVED'
  | 'GOODS_REJECTED'
  | 'INVOICE_SUBMITTED'
  | 'INVOICE_APPROVED'
  | 'INVOICE_REJECTED'
  | 'PAYMENT_PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';

export type ChallanStatus =
  | 'CREATED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED';

export type GRNStatus =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PARTIALLY_ACCEPTED';

export type VendorInvoiceStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'PARTIALLY_PAID';

export interface PurchaseRequisitionItem {
  id: string;
  requisitionId: string;
  productId?: string | null;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  targetRate?: number | null;
  finalizedRate?: number | null;
  finalizedAmount?: number | null;
  notes?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    category?: string;
  } | null;
}

export interface PurchaseRequisition {
  id: string;
  organizationId: string;
  prNumber: string;
  requestedBy: string;
  supplierId?: string | null;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requiredByDate?: string | null;
  status: RequisitionStatus;
  estimatedTotal: number;
  finalizedTotal?: number | null;
  rateFinalizedBy?: string | null;
  rateFinalizedAt?: string | null;
  rateApprovalRemarks?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequisitionItem[];
  supplier?: {
    id: string;
    name: string;
    supplierCode: string;
    email?: string;
    phone?: string;
  } | null;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    username?: string;
  } | null;
  rateFinalizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  rejector?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  purchaseOrders?: Array<{
    id: string;
    poNumber: string;
    status: PurchaseOrderStatus;
    totalAmount: number;
  }>;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string | null;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tax: number;
  total: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

export interface DeliveryChallanItem {
  id: string;
  challanId: string;
  itemName: string;
  dispatchedQuantity: number;
  unit: string;
  remarks?: string | null;
}

export interface DeliveryChallan {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  supplierId: string;
  challanNumber: string;
  dispatchDate: string;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  transporterName?: string | null;
  trackingNumber?: string | null;
  status: ChallanStatus;
  outForDeliveryAt?: string | null;
  notes?: string | null;
  createdAt: string;
  items: DeliveryChallanItem[];
  supplier?: {
    id: string;
    name: string;
  };
}

export interface P2PGoodsReceivedItem {
  id: string;
  grnId: string;
  productId?: string | null;
  itemName: string;
  orderedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  condition?: string | null;
  remarks?: string | null;
}

export interface P2PGoodsReceived {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  challanId?: string | null;
  grnNumber: string;
  receivedDate: string;
  receivedBy: string;
  inspectionRemarks?: string | null;
  status: GRNStatus;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  inventoryUpdated: boolean;
  createdAt: string;
  items: P2PGoodsReceivedItem[];
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface P2PPayment {
  id: string;
  organizationId: string;
  vendorInvoiceId: string;
  purchaseOrderId: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  status: string;
  remarks?: string | null;
  paidBy: string;
  createdAt: string;
  payer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface VendorInvoice {
  id: string;
  organizationId: string;
  purchaseOrderId: string;
  supplierId: string;
  grnId?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: VendorInvoiceStatus;
  accountantRemarks?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  threeWayMatchStatus?: 'MATCHED' | 'DISCREPANCY' | 'OVERBILLED' | 'VARIANCE' | string;
  createdAt: string;
  payments: P2PPayment[];
  supplier?: {
    id: string;
    name: string;
  };
  purchaseOrder?: PurchaseOrder;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  poNumber: string;
  requisitionId?: string | null;
  supplierId: string;
  issuedBy: string;
  issuedAt: string;
  expectedDeliveryDate?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  vendorAcceptedAt?: string | null;
  vendorRejectedAt?: string | null;
  vendorRejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
  supplier: {
    id: string;
    name: string;
    supplierCode: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  challans?: DeliveryChallan[];
  goodsReceivedNotes?: P2PGoodsReceived[];
  vendorInvoices?: VendorInvoice[];
  requisition?: PurchaseRequisition;
  issuer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface P2PStepMilestone {
  stepIndex: number;
  stepName: string;
  roleName: string;
  roleKey: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'WAITING' | 'REJECTED';
  code?: string;
  timestamp?: string | null;
  actor?: string;
  remarks?: string | null;
  challanNumber?: string | null;
  vehicleNumber?: string | null;
  invoiceNumber?: string | null;
  paymentNumber?: string | null;
  paymentStatus?: string | null;
  inventoryUpdated?: boolean;
  details?: any;
}

export interface P2PCycleTracker {
  purchaseOrder?: PurchaseOrder | null;
  purchaseRequisition?: PurchaseRequisition | null;
  overallStatus: string;
  steps: P2PStepMilestone[];
}

export interface P2PDashboardSummary {
  summary: {
    totalRequisitions: number;
    pendingRateApproval: number;
    ratesFinalized: number;
    rejectedPRs: number;
    totalOrders: number;
    activePOs: number;
    outForDelivery: number;
    goodsReceived: number;
    pendingInvoices: number;
    completedPayments: number;
    totalSpend: number;
    suppliersCount: number;
  };
  recentOrders: PurchaseOrder[];
  recentRequisitions: PurchaseRequisition[];
}
