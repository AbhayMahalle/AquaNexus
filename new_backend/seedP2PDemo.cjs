require('dotenv').config();
const prisma = require('./src/config/db.js');

async function seedP2P() {
  console.log('Seeding initial P2P demo data...');

  const org = await prisma.organization.findFirst({ where: { slug: 'aquanexus-primary' } });
  if (!org) {
    console.error('Organization not found');
    return;
  }

  const storeUser = await prisma.user.findUnique({ where: { email: 'store@aquanexus.com' } });
  const managerUser = await prisma.user.findUnique({ where: { email: 'manager@aquanexus.com' } });
  const accountantUser = await prisma.user.findUnique({ where: { email: 'accountant@aquanexus.com' } });
  const supplier = await prisma.supplier.findFirst({ where: { organizationId: org.id } });
  const product = await prisma.product.findFirst({ where: { organizationId: org.id } });

  if (!storeUser || !managerUser || !supplier) {
    console.error('Required users or supplier missing');
    return;
  }

  // Clean existing demo P2P records if any to avoid duplication
  const existingPR = await prisma.purchaseRequisition.findFirst({ where: { organizationId: org.id } });
  if (existingPR) {
    console.log('P2P demo data already exists, skipping seed.');
    return;
  }

  // 1. PR Pending Rate Approval (Store Manager -> Waiting for Ops Manager)
  await prisma.purchaseRequisition.create({
    data: {
      organizationId: org.id,
      prNumber: 'PR-2026-0001',
      requestedBy: storeUser.id,
      title: 'Monthly PET Preforms & 28mm Caps Replenishment',
      priority: 'HIGH',
      requiredByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'PENDING_RATE_APPROVAL',
      estimatedTotal: 45000,
      notes: 'Store inventory dropping below reorder threshold. Needed for continuous 1L bottling run.',
      items: {
        create: [
          {
            productId: product?.id || null,
            itemName: 'PET Preforms (20g transparent)',
            requestedQuantity: 5000,
            unit: 'pcs',
            targetRate: 6.5,
            notes: 'High-clarity virgin food grade PET',
          },
          {
            itemName: 'Bottle Screw Caps (28mm Blue Tamper-evident)',
            requestedQuantity: 5000,
            unit: 'pcs',
            targetRate: 2.5,
            notes: 'Matching 1L mineral water bottles',
          },
        ],
      },
    },
  });

  // 2. PR with Rates Finalized (Ops Manager approved -> Ready for PO Issuance)
  await prisma.purchaseRequisition.create({
    data: {
      organizationId: org.id,
      prNumber: 'PR-2026-0002',
      requestedBy: storeUser.id,
      supplierId: supplier.id,
      rateFinalizedBy: managerUser.id,
      rateFinalizedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      rateApprovalRemarks: 'Approved negotiated rate with PackageMart Pvt Ltd (5% volume discount applied)',
      title: 'Water Treatment Purification Filter Cartridges',
      priority: 'MEDIUM',
      requiredByDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'RATES_FINALIZED',
      estimatedTotal: 22000,
      finalizedTotal: 20500,
      notes: 'Quarterly RO filtration stage 2 maintenance replacement',
      items: {
        create: [
          {
            itemName: 'Spun Polypropylene 5 Micron Cartridge (20-inch)',
            requestedQuantity: 40,
            unit: 'units',
            targetRate: 350,
            finalizedRate: 325,
            finalizedAmount: 13000,
          },
          {
            itemName: 'Activated Carbon Block Filters (20-inch)',
            requestedQuantity: 15,
            unit: 'units',
            targetRate: 550,
            finalizedRate: 500,
            finalizedAmount: 7500,
          },
        ],
      },
    },
  });

  // 3. PO Active: Challan Created & Out for Delivery (Store Manager awaiting dock arrival)
  const pr3 = await prisma.purchaseRequisition.create({
    data: {
      organizationId: org.id,
      prNumber: 'PR-2026-0003',
      requestedBy: storeUser.id,
      supplierId: supplier.id,
      rateFinalizedBy: managerUser.id,
      rateFinalizedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      title: 'Label Rolls & Shrink Film Procurement',
      priority: 'URGENT',
      status: 'PO_ISSUED',
      estimatedTotal: 35000,
      finalizedTotal: 34000,
      items: {
        create: [
          {
            itemName: 'AquaNexus 1L Front & Back BOPP Labels (Roll of 2,000)',
            requestedQuantity: 10,
            unit: 'rolls',
            targetRate: 2400,
            finalizedRate: 2300,
            finalizedAmount: 23000,
          },
          {
            itemName: 'Polyethylene Shrink Bundling Film (40 Micron)',
            requestedQuantity: 20,
            unit: 'rolls',
            targetRate: 600,
            finalizedRate: 550,
            finalizedAmount: 11000,
          },
        ],
      },
    },
  });

  const po3 = await prisma.purchaseOrder.create({
    data: {
      organizationId: org.id,
      poNumber: 'PO-2026-0001',
      requisitionId: pr3.id,
      supplierId: supplier.id,
      issuedBy: storeUser.id,
      issuedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      paymentTerms: 'Net 30 Days',
      deliveryTerms: 'FOB Store Dock Gate 2',
      subtotal: 34000,
      taxRate: 18,
      taxAmount: 6120,
      totalAmount: 40120,
      status: 'OUT_FOR_DELIVERY',
      vendorAcceptedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      notes: 'Shipment dispatched via Express Logistics. Dock inspection pending.',
      items: {
        create: [
          {
            itemName: 'AquaNexus 1L Front & Back BOPP Labels (Roll of 2,000)',
            quantity: 10,
            unit: 'rolls',
            unitPrice: 2300,
            tax: 4140,
            total: 23000,
          },
          {
            itemName: 'Polyethylene Shrink Bundling Film (40 Micron)',
            quantity: 20,
            unit: 'rolls',
            unitPrice: 550,
            tax: 1980,
            total: 11000,
          },
        ],
      },
    },
  });

  await prisma.deliveryChallan.create({
    data: {
      organizationId: org.id,
      purchaseOrderId: po3.id,
      supplierId: supplier.id,
      challanNumber: 'CH-2026-0001',
      dispatchDate: new Date(),
      vehicleNumber: 'MH-12-AB-4509',
      driverName: 'Ramesh Shinde',
      driverPhone: '+91 98220 12345',
      transporterName: 'Om Sai Logistics',
      trackingNumber: 'OSL-998812',
      status: 'OUT_FOR_DELIVERY',
      outForDeliveryAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      notes: 'Vehicle en route to plant gate. Expected arrival in 45 mins.',
      items: {
        create: [
          {
            itemName: 'AquaNexus 1L Front & Back BOPP Labels (Roll of 2,000)',
            dispatchedQuantity: 10,
            unit: 'rolls',
            remarks: 'Loaded in bay 1',
          },
          {
            itemName: 'Polyethylene Shrink Bundling Film (40 Micron)',
            dispatchedQuantity: 20,
            unit: 'rolls',
            remarks: 'Loaded in bay 2',
          },
        ],
      },
    },
  });

  // 4. Completed P2P Cycle (PR -> Rate Approved -> PO -> Challan -> GRN Accepted -> Invoice Approved -> Paid)
  const pr4 = await prisma.purchaseRequisition.create({
    data: {
      organizationId: org.id,
      prNumber: 'PR-2026-0004',
      requestedBy: storeUser.id,
      supplierId: supplier.id,
      rateFinalizedBy: managerUser.id,
      rateFinalizedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      title: 'Water Treatment Food Grade Chlorine Solution (20L Cans)',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      estimatedTotal: 18000,
      finalizedTotal: 17500,
      items: {
        create: [
          {
            itemName: 'Sodium Hypochlorite Solution 12% (Food Grade 20L Can)',
            requestedQuantity: 25,
            unit: 'cans',
            targetRate: 720,
            finalizedRate: 700,
            finalizedAmount: 17500,
          },
        ],
      },
    },
  });

  const po4 = await prisma.purchaseOrder.create({
    data: {
      organizationId: org.id,
      poNumber: 'PO-2026-0002',
      requisitionId: pr4.id,
      supplierId: supplier.id,
      issuedBy: storeUser.id,
      issuedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      subtotal: 17500,
      taxRate: 18,
      taxAmount: 3150,
      totalAmount: 20650,
      status: 'COMPLETED',
      vendorAcceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            itemName: 'Sodium Hypochlorite Solution 12% (Food Grade 20L Can)',
            quantity: 25,
            unit: 'cans',
            unitPrice: 700,
            tax: 3150,
            total: 17500,
          },
        ],
      },
    },
  });

  const challan4 = await prisma.deliveryChallan.create({
    data: {
      organizationId: org.id,
      purchaseOrderId: po4.id,
      supplierId: supplier.id,
      challanNumber: 'CH-2026-0002',
      dispatchDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      vehicleNumber: 'MH-14-GH-7788',
      driverName: 'Santosh Yadav',
      status: 'DELIVERED',
      items: {
        create: [
          {
            itemName: 'Sodium Hypochlorite Solution 12% (Food Grade 20L Can)',
            dispatchedQuantity: 25,
            unit: 'cans',
          },
        ],
      },
    },
  });

  const grn4 = await prisma.p2PGoodsReceived.create({
    data: {
      organizationId: org.id,
      purchaseOrderId: po4.id,
      challanId: challan4.id,
      grnNumber: 'P2P-GRN-2026-0001',
      receivedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      receivedBy: storeUser.id,
      inspectionRemarks: 'All 25 cans sealed with QA certificates attached. Inwarded to Chemical Storage.',
      status: 'ACCEPTED',
      inventoryUpdated: true,
      items: {
        create: [
          {
            itemName: 'Sodium Hypochlorite Solution 12% (Food Grade 20L Can)',
            orderedQuantity: 25,
            dispatchedQuantity: 25,
            receivedQuantity: 25,
            acceptedQuantity: 25,
            rejectedQuantity: 0,
            unit: 'cans',
            condition: 'GOOD',
            remarks: 'Quality verified',
          },
        ],
      },
    },
  });

  const invoice4 = await prisma.vendorInvoice.create({
    data: {
      organizationId: org.id,
      purchaseOrderId: po4.id,
      supplierId: supplier.id,
      grnId: grn4.id,
      invoiceNumber: 'VINV-2026-0088',
      invoiceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
      subtotal: 17500,
      taxAmount: 3150,
      totalAmount: 20650,
      status: 'PAID',
      threeWayMatchStatus: 'MATCHED',
      accountantRemarks: 'PO, GRN and Vendor Invoice amounts fully verified (100% Match)',
      reviewedBy: accountantUser?.id || storeUser.id,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.p2PPayment.create({
    data: {
      organizationId: org.id,
      vendorInvoiceId: invoice4.id,
      purchaseOrderId: po4.id,
      paymentNumber: 'PAY-P2P-2026-0001',
      amount: 20650,
      paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-AXIS-99238472',
      status: 'COMPLETED',
      remarks: 'Full settlement for Chemical Procurement invoice VINV-2026-0088',
      paidBy: accountantUser?.id || storeUser.id,
    },
  });

  // 5. Rejected PR (Ops Manager rejected rate/justification)
  await prisma.purchaseRequisition.create({
    data: {
      organizationId: org.id,
      prNumber: 'PR-2026-0005',
      requestedBy: storeUser.id,
      rejectedBy: managerUser.id,
      rejectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      rejectionReason: 'Surplus inventory of 1,200 secondary cartons verified in Annex warehouse. Reorder deferred by 45 days.',
      title: 'Corrugated 24-Bottle Packaging Cartons (1L Bottles)',
      priority: 'LOW',
      status: 'REJECTED',
      estimatedTotal: 28000,
      notes: 'Request for additional carton stock',
      items: {
        create: [
          {
            itemName: 'Heavy Duty 5-Ply Corrugated Box (24 x 1L)',
            requestedQuantity: 800,
            unit: 'boxes',
            targetRate: 35,
            notes: 'Printed with AquaNexus logo',
          },
        ],
      },
    },
  });

  console.log('P2P demo data seeded successfully!');
}

seedP2P()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  });
