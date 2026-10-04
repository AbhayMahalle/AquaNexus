const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");
const { createAuditLog } = require("../services/audit.service");

/**
 * Broadcast notifications to users belonging to target roles in the organization
 */
const notifyRoles = async (organizationId, roles, title, message, type = "INFO") => {
  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        userRoles: {
          some: {
            role: {
              name: { in: roles },
            },
          },
        },
      },
      select: { id: true },
    });

    for (const u of users) {
      await notificationService.createNotification({
        userId: u.id,
        organizationId,
        title,
        message,
        type,
      });
    }
  } catch (err) {
    console.warn("[P2P] Notification dispatch warning:", err.message);
  }
};

/**
 * Generate formatted code with date & sequence
 */
const generateP2PCode = async (prefix, model, field, organizationId) => {
  const year = new Date().getFullYear();
  const count = await prisma[model].count({
    where: { organizationId },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${seq}`;
};

// ============================================================
// STEP 1: PURCHASE REQUISITIONS (PR) — STORE MANAGER
// ============================================================

/**
 * Create Purchase Requisition (Quantity Request)
 * Initiated by Store Manager
 */
const createRequisition = async (req, res) => {
  try {
    const { title, priority = "MEDIUM", requiredByDate, notes, items } = req.body;

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, "Title and at least one requested item are required", 400);
    }

    const prNumber = await generateP2PCode("PR", "purchaseRequisition", "prNumber", req.organizationId);

    let estimatedTotal = 0;
    const validatedItems = items.map((it) => {
      const qty = parseInt(it.requestedQuantity || it.quantity || 1);
      const targetRate = parseFloat(it.targetRate || 0);
      const amount = qty * targetRate;
      estimatedTotal += amount;

      return {
        productId: it.productId || null,
        itemName: it.itemName || "Raw Material",
        requestedQuantity: qty,
        unit: it.unit || "units",
        targetRate: targetRate > 0 ? targetRate : null,
        notes: it.notes || null,
      };
    });

    const requisition = await prisma.purchaseRequisition.create({
      data: {
        organizationId: req.organizationId,
        prNumber,
        title,
        priority,
        requiredByDate: requiredByDate ? new Date(requiredByDate) : null,
        status: "PENDING_RATE_APPROVAL",
        requestedBy: req.user.id,
        estimatedTotal,
        notes,
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "CREATE",
      entityType: "PURCHASE_REQUISITION",
      entityId: requisition.id,
      newValues: { prNumber, title, estimatedTotal, itemCount: validatedItems.length },
      ipAddress: req.ip,
    });

    // Notify Operations Managers and Admins for Rate Finalisation
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "MANAGER"],
      `New Requisition ${prNumber}`,
      `Store Manager requested ${validatedItems.length} items (${title}). Pending Rate Finalisation & Approval.`,
      "INFO"
    );

    return sendSuccess(res, requisition, "Purchase Requisition created successfully", 201);
  } catch (error) {
    console.error("createRequisition error:", error);
    return sendError(res, error.message || "Failed to create Purchase Requisition", 500);
  }
};

/**
 * List Purchase Requisitions with filters
 */
const getRequisitions = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { prNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const requisitions = await prisma.purchaseRequisition.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
        supplier: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        rateFinalizer: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        purchaseOrders: {
          select: { id: true, poNumber: true, status: true, totalAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.purchaseRequisition.count({ where });

    return sendSuccess(
      res,
      { requisitions, pagination: { total, page: parseInt(page), limit: parseInt(limit) } },
      "Purchase Requisitions retrieved successfully"
    );
  } catch (error) {
    console.error("getRequisitions error:", error);
    return sendError(res, "Failed to retrieve Purchase Requisitions", 500);
  }
};

/**
 * Get Purchase Requisition by ID
 */
const getRequisitionById = async (req, res) => {
  try {
    const requisition = await prisma.purchaseRequisition.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId,
      },
      include: {
        items: {
          include: { product: true },
        },
        supplier: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        rateFinalizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        rejector: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        purchaseOrders: {
          include: {
            supplier: true,
            challans: true,
            goodsReceivedNotes: true,
            vendorInvoices: true,
            p2pPayments: true,
          },
        },
      },
    });

    if (!requisition) {
      return sendError(res, "Purchase Requisition not found", 404);
    }

    return sendSuccess(res, requisition, "Purchase Requisition details retrieved");
  } catch (error) {
    console.error("getRequisitionById error:", error);
    return sendError(res, "Failed to retrieve Requisition details", 500);
  }
};

// ============================================================
// STEP 2: RATE FINALISATION & APPROVAL / REJECTION — OPS MANAGER
// ============================================================

/**
 * Finalize Rates & Approve PR (Operational Manager Action)
 */
const finalizeRatesAndApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId, rateApprovalRemarks, items } = req.body;

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { items: true },
    });

    if (!requisition) {
      return sendError(res, "Purchase Requisition not found", 404);
    }

    if (requisition.status !== "PENDING_RATE_APPROVAL" && requisition.status !== "DRAFT") {
      return sendError(res, `Cannot finalize rates for PR in status ${requisition.status}`, 400);
    }

    let finalizedTotal = 0;
    const itemUpdates = [];

    if (items && Array.isArray(items)) {
      for (const it of items) {
        const rate = parseFloat(it.finalizedRate || it.rate || 0);
        const existingItem = requisition.items.find((x) => x.id === it.id);
        const qty = existingItem ? existingItem.requestedQuantity : 1;
        const lineTotal = rate * qty;
        finalizedTotal += lineTotal;

        itemUpdates.push(
          prisma.purchaseRequisitionItem.update({
            where: { id: it.id },
            data: {
              finalizedRate: rate,
              finalizedAmount: lineTotal,
            },
          })
        );
      }
    }

    // Execute updates in transaction
    await prisma.$transaction([
      ...itemUpdates,
      prisma.purchaseRequisition.update({
        where: { id },
        data: {
          supplierId: supplierId || requisition.supplierId,
          rateFinalizedBy: req.user.id,
          rateFinalizedAt: new Date(),
          rateApprovalRemarks: rateApprovalRemarks || "Rates negotiated & approved",
          finalizedTotal,
          status: "RATES_FINALIZED",
        },
      }),
    ]);

    const updated = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: { items: true, supplier: true, requester: true, rateFinalizer: true },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "APPROVE_RATES",
      entityType: "PURCHASE_REQUISITION",
      entityId: id,
      newValues: { finalizedTotal, status: "RATES_FINALIZED", supplierId },
      ipAddress: req.ip,
    });

    // Notify Store Manager that rates are finalized and PO can be issued
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "STORE_MANAGER"],
      `Rates Approved for ${requisition.prNumber}`,
      `Operational Manager finalized rates (Total: ₹${finalizedTotal.toFixed(2)}). PO ready for issuance.`,
      "SUCCESS"
    );

    return sendSuccess(res, updated, "Rates finalized and requisition approved successfully");
  } catch (error) {
    console.error("finalizeRatesAndApprove error:", error);
    return sendError(res, error.message || "Failed to finalize rates and approve", 500);
  }
};

/**
 * Reject PR / Rates (Operational Manager Action)
 */
const rejectRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return sendError(res, "Rejection reason is mandatory", 400);
    }

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!requisition) {
      return sendError(res, "Purchase Requisition not found", 404);
    }

    const updated = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        rejectionReason,
      },
      include: { requester: true, rejector: true },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "REJECT",
      entityType: "PURCHASE_REQUISITION",
      entityId: id,
      newValues: { status: "REJECTED", rejectionReason },
      ipAddress: req.ip,
    });

    // Notify Store Manager of rejection
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "STORE_MANAGER"],
      `Requisition Rejected: ${requisition.prNumber}`,
      `Reason: ${rejectionReason}. Action required.`,
      "ALERT"
    );

    return sendSuccess(res, updated, "Purchase Requisition rejected");
  } catch (error) {
    console.error("rejectRequisition error:", error);
    return sendError(res, "Failed to reject Purchase Requisition", 500);
  }
};

/**
 * Generate Purchase Order from Approved Requisition
 * Triggered by Store Manager / Ops Manager
 */
const generatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params; // Requisition ID
    const {
      supplierId,
      expectedDeliveryDate,
      paymentTerms = "Net 30 Days",
      deliveryTerms = "FOB Plant Gate Store",
      taxRate = 18,
      notes,
    } = req.body;

    const requisition = await prisma.purchaseRequisition.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { items: true, supplier: true },
    });

    if (!requisition) {
      return sendError(res, "Purchase Requisition not found", 404);
    }

    if (requisition.status !== "RATES_FINALIZED") {
      return sendError(res, "Requisition must have RATES_FINALIZED before issuing PO", 400);
    }

    const finalSupplierId = supplierId || requisition.supplierId;
    if (!finalSupplierId) {
      return sendError(res, "Supplier must be selected to generate PO", 400);
    }

    const poNumber = await generateP2PCode("PO", "purchaseOrder", "poNumber", req.organizationId);

    let subtotal = 0;
    const poItems = requisition.items.map((it) => {
      const unitPrice = parseFloat(it.finalizedRate || it.targetRate || 0);
      const total = unitPrice * it.requestedQuantity;
      subtotal += total;

      return {
        productId: it.productId,
        itemName: it.itemName,
        quantity: it.requestedQuantity,
        unit: it.unit,
        unitPrice,
        tax: (total * parseFloat(taxRate)) / 100,
        total,
      };
    });

    const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
    const totalAmount = subtotal + taxAmount;

    // Transaction to create PO and update PR
    const [purchaseOrder] = await prisma.$transaction([
      prisma.purchaseOrder.create({
        data: {
          organizationId: req.organizationId,
          poNumber,
          requisitionId: requisition.id,
          supplierId: finalSupplierId,
          issuedBy: req.user.id,
          issuedAt: new Date(),
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          paymentTerms,
          deliveryTerms,
          subtotal,
          taxRate: parseFloat(taxRate),
          taxAmount,
          totalAmount,
          status: "ISSUED",
          notes,
          items: {
            create: poItems,
          },
        },
        include: {
          items: true,
          supplier: true,
          issuer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.purchaseRequisition.update({
        where: { id: requisition.id },
        data: { status: "PO_ISSUED" },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "ISSUE_PO",
      entityType: "PURCHASE_ORDER",
      entityId: purchaseOrder.id,
      newValues: { poNumber, supplierId: finalSupplierId, totalAmount, status: "ISSUED" },
      ipAddress: req.ip,
    });

    // Notify Vendor/Supplier, Ops Manager, and Admin
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "MANAGER", "SUPPLIER"],
      `Purchase Order Issued: ${poNumber}`,
      `Purchase order of ₹${totalAmount.toFixed(2)} issued to supplier. Awaiting Vendor Acceptance.`,
      "INFO"
    );

    return sendSuccess(res, purchaseOrder, "Purchase Order generated and issued successfully", 201);
  } catch (error) {
    console.error("generatePurchaseOrder error:", error);
    return sendError(res, error.message || "Failed to generate Purchase Order", 500);
  }
};

// ============================================================
// STEP 3: VENDOR / SUPPLIER — ACCEPT/REJECT & DELIVERY CHALLAN
// ============================================================

/**
 * List Purchase Orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplierId, search, page = 1, limit = 50 } = req.query;
    const where = { organizationId: req.organizationId };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },
        challans: { include: { items: true } },
        goodsReceivedNotes: { include: { items: true } },
        vendorInvoices: { include: { payments: true } },
        issuer: { select: { id: true, firstName: true, lastName: true } },
        requisition: { select: { id: true, prNumber: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.purchaseOrder.count({ where });

    return sendSuccess(
      res,
      { orders, pagination: { total, page: parseInt(page), limit: parseInt(limit) } },
      "Purchase Orders retrieved successfully"
    );
  } catch (error) {
    console.error("getPurchaseOrders error:", error);
    return sendError(res, "Failed to retrieve Purchase Orders", 500);
  }
};

/**
 * Get Purchase Order by ID
 */
const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        challans: { include: { items: true } },
        goodsReceivedNotes: {
          include: {
            items: true,
            receiver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        vendorInvoices: {
          include: {
            payments: {
              include: { payer: { select: { id: true, firstName: true, lastName: true } } },
            },
            reviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        requisition: {
          include: {
            requester: { select: { id: true, firstName: true, lastName: true } },
            rateFinalizer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        issuer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    return sendSuccess(res, order, "Purchase Order details retrieved");
  } catch (error) {
    console.error("getPurchaseOrderById error:", error);
    return sendError(res, "Failed to retrieve Purchase Order details", 500);
  }
};

/**
 * Vendor Accept PO
 */
const vendorAcceptOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { supplier: true },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    if (order.status !== "ISSUED") {
      return sendError(res, `Cannot accept PO in status ${order.status}`, 400);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "VENDOR_ACCEPTED",
        vendorAcceptedAt: new Date(),
      },
      include: { supplier: true },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "VENDOR_ACCEPT_PO",
      entityType: "PURCHASE_ORDER",
      entityId: id,
      newValues: { status: "VENDOR_ACCEPTED" },
      ipAddress: req.ip,
    });

    // Notify Ops Manager and Store Manager
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "MANAGER", "STORE_MANAGER"],
      `PO Accepted by Vendor: ${order.poNumber}`,
      `Supplier ${order.supplier.name} confirmed PO ${order.poNumber}. Delivery Challan pending.`,
      "SUCCESS"
    );

    return sendSuccess(res, updated, "Purchase Order accepted by Vendor");
  } catch (error) {
    console.error("vendorAcceptOrder error:", error);
    return sendError(res, "Failed to accept Purchase Order", 500);
  }
};

/**
 * Vendor Reject PO
 */
const vendorRejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, "Rejection reason is required", 400);
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { supplier: true },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "VENDOR_REJECTED",
        vendorRejectedAt: new Date(),
        vendorRejectionReason: reason,
      },
      include: { supplier: true },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "VENDOR_REJECT_PO",
      entityType: "PURCHASE_ORDER",
      entityId: id,
      newValues: { status: "VENDOR_REJECTED", reason },
      ipAddress: req.ip,
    });

    // Notify Ops Manager and Store Manager
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "MANAGER", "STORE_MANAGER"],
      `PO Rejected by Vendor: ${order.poNumber}`,
      `Supplier ${order.supplier.name} rejected PO. Reason: ${reason}`,
      "ALERT"
    );

    return sendSuccess(res, updated, "Purchase Order rejected by Vendor");
  } catch (error) {
    console.error("vendorRejectOrder error:", error);
    return sendError(res, "Failed to reject Purchase Order", 500);
  }
};

/**
 * Create Delivery Challan & Dispatch (Vendor Action)
 */
const createDeliveryChallan = async (req, res) => {
  try {
    const { id } = req.params; // PO ID
    const {
      dispatchDate = new Date(),
      vehicleNumber,
      driverName,
      driverPhone,
      transporterName,
      trackingNumber,
      notes,
      markOutForDelivery = true,
      items,
    } = req.body;

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { items: true, supplier: true },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    if (order.status !== "VENDOR_ACCEPTED" && order.status !== "ISSUED" && order.status !== "CHALLAN_CREATED") {
      return sendError(res, `Cannot create challan for PO in status ${order.status}`, 400);
    }

    const challanNumber = await generateP2PCode("CH", "deliveryChallan", "challanNumber", req.organizationId);

    const challanItems = (items || order.items).map((it) => ({
      itemName: it.itemName,
      dispatchedQuantity: parseInt(it.dispatchedQuantity || it.quantity || 1),
      unit: it.unit || "units",
      remarks: it.remarks || null,
    }));

    const status = markOutForDelivery ? "OUT_FOR_DELIVERY" : "CREATED";

    const [challan] = await prisma.$transaction([
      prisma.deliveryChallan.create({
        data: {
          organizationId: req.organizationId,
          purchaseOrderId: order.id,
          supplierId: order.supplierId,
          challanNumber,
          dispatchDate: new Date(dispatchDate),
          vehicleNumber,
          driverName,
          driverPhone,
          transporterName,
          trackingNumber,
          status,
          outForDeliveryAt: markOutForDelivery ? new Date() : null,
          notes,
          items: {
            create: challanItems,
          },
        },
        include: { items: true, supplier: true, purchaseOrder: true },
      }),
      prisma.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: markOutForDelivery ? "OUT_FOR_DELIVERY" : "CHALLAN_CREATED",
        },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "CREATE_CHALLAN",
      entityType: "DELIVERY_CHALLAN",
      entityId: challan.id,
      newValues: { challanNumber, poNumber: order.poNumber, status },
      ipAddress: req.ip,
    });

    // Notify Store Manager and Ops Manager
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "STORE_MANAGER", "MANAGER"],
      `Shipment Dispatched: Challan ${challanNumber}`,
      `Vehicle: ${vehicleNumber || "N/A"}. Status: ${status}. Shipment for PO ${order.poNumber} is on the way!`,
      "INFO"
    );

    return sendSuccess(res, challan, "Delivery Challan created and dispatched successfully", 201);
  } catch (error) {
    console.error("createDeliveryChallan error:", error);
    return sendError(res, error.message || "Failed to create Delivery Challan", 500);
  }
};

/**
 * Mark Challan as Out for Delivery
 */
const markChallanOutForDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await prisma.deliveryChallan.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { purchaseOrder: true },
    });

    if (!challan) {
      return sendError(res, "Delivery Challan not found", 404);
    }

    const [updatedChallan] = await prisma.$transaction([
      prisma.deliveryChallan.update({
        where: { id },
        data: {
          status: "OUT_FOR_DELIVERY",
          outForDeliveryAt: new Date(),
        },
      }),
      prisma.purchaseOrder.update({
        where: { id: challan.purchaseOrderId },
        data: { status: "OUT_FOR_DELIVERY" },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "OUT_FOR_DELIVERY",
      entityType: "DELIVERY_CHALLAN",
      entityId: id,
      newValues: { status: "OUT_FOR_DELIVERY" },
      ipAddress: req.ip,
    });

    // Notify Store Manager to prepare receiving dock
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "STORE_MANAGER"],
      `Out For Delivery: ${challan.challanNumber}`,
      `Shipment for PO ${challan.purchaseOrder.poNumber} is OUT FOR DELIVERY. Prepare store inspection dock.`,
      "WARNING"
    );

    return sendSuccess(res, updatedChallan, "Challan marked as Out for Delivery");
  } catch (error) {
    console.error("markChallanOutForDelivery error:", error);
    return sendError(res, "Failed to update delivery status", 500);
  }
};

// ============================================================
// STEP 4: GOODS RECEIVED (GRN INSPECTION & ACCEPT/REJECT) — STORE MANAGER
// ============================================================

/**
 * Process Goods Received (Store Manager Action)
 * Can Accept (updates store inventory) or Reject (damages/wrong specs)
 */
const processGoodsReceived = async (req, res) => {
  try {
    const { id } = req.params; // Purchase Order ID
    const {
      challanId,
      receivedDate = new Date(),
      inspectionRemarks,
      isAccepted = true,
      rejectionReason,
      items,
    } = req.body;

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { items: true, supplier: true },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    const grnNumber = await generateP2PCode("P2P-GRN", "p2PGoodsReceived", "grnNumber", req.organizationId);

    if (!isAccepted) {
      // Goods REJECTED at dock inspection
      if (!rejectionReason) {
        return sendError(res, "Rejection reason is required when rejecting goods", 400);
      }

      const rejectedGRN = await prisma.p2PGoodsReceived.create({
        data: {
          organizationId: req.organizationId,
          purchaseOrderId: order.id,
          challanId: challanId || null,
          grnNumber,
          receivedDate: new Date(receivedDate),
          receivedBy: req.user.id,
          inspectionRemarks: inspectionRemarks || "Inspection failed at gate",
          status: "REJECTED",
          rejectionReason,
          rejectedAt: new Date(),
          inventoryUpdated: false,
          items: {
            create: (items || order.items).map((it) => ({
              productId: it.productId || null,
              itemName: it.itemName,
              orderedQuantity: it.orderedQuantity || it.quantity || 1,
              dispatchedQuantity: it.dispatchedQuantity || it.quantity || 1,
              receivedQuantity: it.receivedQuantity || 0,
              acceptedQuantity: 0,
              rejectedQuantity: it.rejectedQuantity || it.quantity || 1,
              unit: it.unit || "units",
              condition: "DEFECTIVE",
              remarks: rejectionReason,
            })),
          },
        },
        include: { items: true },
      });

      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: { status: "GOODS_REJECTED" },
      });

      if (challanId) {
        await prisma.deliveryChallan.update({
          where: { id: challanId },
          data: { status: "REJECTED" },
        });
      }

      await createAuditLog({
        userId: req.user.id,
        organizationId: req.organizationId,
        action: "REJECT_GOODS",
        entityType: "P2P_GOODS_RECEIVED",
        entityId: rejectedGRN.id,
        newValues: { grnNumber, status: "REJECTED", rejectionReason },
        ipAddress: req.ip,
      });

      // Notify Supplier, Ops Manager, and Accountant
      await notifyRoles(
        req.organizationId,
        ["ADMIN", "MANAGER", "SUPPLIER"],
        `Delivery Rejected: ${order.poNumber}`,
        `Goods rejected by Store Manager. GRN: ${grnNumber}. Reason: ${rejectionReason}`,
        "ALERT"
      );

      return sendSuccess(res, rejectedGRN, "Goods rejected and recorded in GRN inspection log");
    }

    // Goods ACCEPTED (or partially accepted)
    const grnItemsData = (items || order.items).map((it) => {
      const ordered = parseInt(it.orderedQuantity || it.quantity || 1);
      const dispatched = parseInt(it.dispatchedQuantity || it.quantity || 1);
      const received = parseInt(it.receivedQuantity !== undefined ? it.receivedQuantity : dispatched);
      const accepted = parseInt(it.acceptedQuantity !== undefined ? it.acceptedQuantity : received);
      const rejected = parseInt(it.rejectedQuantity !== undefined ? it.rejectedQuantity : Math.max(0, received - accepted));

      return {
        productId: it.productId || null,
        itemName: it.itemName,
        orderedQuantity: ordered,
        dispatchedQuantity: dispatched,
        receivedQuantity: received,
        acceptedQuantity: accepted,
        rejectedQuantity: rejected,
        unit: it.unit || "units",
        condition: rejected > 0 ? "PARTIAL_DAMAGE" : "GOOD",
        remarks: it.remarks || inspectionRemarks || "Inspected and accepted",
      };
    });

    const isPartial = grnItemsData.some((x) => x.rejectedQuantity > 0);
    const grnStatus = isPartial ? "PARTIALLY_ACCEPTED" : "ACCEPTED";

    // Prepare inventory updates & stock transactions
    const inventoryUpdates = [];
    const stockTransactions = [];

    for (const item of grnItemsData) {
      if (item.productId && item.acceptedQuantity > 0) {
        inventoryUpdates.push(
          prisma.inventory.upsert({
            where: { productId: item.productId },
            update: {
              quantity: { increment: item.acceptedQuantity },
            },
            create: {
              organizationId: req.organizationId,
              productId: item.productId,
              quantity: item.acceptedQuantity,
              reorderLevel: 50,
            },
          })
        );

        stockTransactions.push(
          prisma.stockTransaction.create({
            data: {
              organizationId: req.organizationId,
              productId: item.productId,
              transactionType: "STOCK_IN",
              quantity: item.acceptedQuantity,
              referenceType: "P2P_GRN",
              referenceId: order.id,
              remarks: `P2P GRN ${grnNumber} from Supplier ${order.supplier.name}`,
              createdBy: req.user.id,
            },
          })
        );
      }
    }

    // Execute in transaction
    const [grn] = await prisma.$transaction([
      prisma.p2PGoodsReceived.create({
        data: {
          organizationId: req.organizationId,
          purchaseOrderId: order.id,
          challanId: challanId || null,
          grnNumber,
          receivedDate: new Date(receivedDate),
          receivedBy: req.user.id,
          inspectionRemarks: inspectionRemarks || "Passed quality and store count check",
          status: grnStatus,
          inventoryUpdated: inventoryUpdates.length > 0,
          items: {
            create: grnItemsData,
          },
        },
        include: { items: true, receiver: true },
      }),
      prisma.purchaseOrder.update({
        where: { id: order.id },
        data: { status: "GOODS_RECEIVED" },
      }),
      ...(challanId
        ? [
            prisma.deliveryChallan.update({
              where: { id: challanId },
              data: { status: "DELIVERED" },
            }),
          ]
        : []),
      ...inventoryUpdates,
      ...stockTransactions,
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "ACCEPT_GOODS",
      entityType: "P2P_GOODS_RECEIVED",
      entityId: grn.id,
      newValues: { grnNumber, status: grnStatus, inventoryUpdated: true },
      ipAddress: req.ip,
    });

    // Notify Accountant that goods are received and ready for invoice matching & payment
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "ACCOUNTANT", "MANAGER"],
      `Goods Received: GRN ${grnNumber}`,
      `Store Manager accepted delivery for PO ${order.poNumber}. Central store inventory updated. Ready for invoice & payment.`,
      "SUCCESS"
    );

    return sendSuccess(res, grn, "Goods received successfully, store inventory updated", 201);
  } catch (error) {
    console.error("processGoodsReceived error:", error);
    return sendError(res, error.message || "Failed to process Goods Received", 500);
  }
};

// ============================================================
// STEP 5: ACCOUNTANT — INVOICE & 3-WAY MATCH & PAYMENT
// ============================================================

/**
 * Submit Vendor Purchase Invoice
 */
const submitVendorInvoice = async (req, res) => {
  try {
    const { id } = req.params; // Purchase Order ID
    const {
      invoiceNumber,
      invoiceDate = new Date(),
      dueDate,
      subtotal,
      taxAmount,
      totalAmount,
      grnId,
      accountantRemarks,
    } = req.body;

    if (!invoiceNumber) {
      return sendError(res, "Invoice number is required", 400);
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        goodsReceivedNotes: {
          include: { items: true },
        },
      },
    });

    if (!order) {
      return sendError(res, "Purchase Order not found", 404);
    }

    const billedTotal = parseFloat(totalAmount || order.totalAmount);
    const poTotal = parseFloat(order.totalAmount);

    // 3-Way Match Verification (PO Amount vs GRN Quantity x Finalized Rate vs Invoice Amount)
    let threeWayMatchStatus = "MATCHED";
    const variance = Math.abs(billedTotal - poTotal);
    if (variance > 5.0) {
      threeWayMatchStatus = billedTotal > poTotal ? "OVERBILLED" : "VARIANCE";
    }

    const calcDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [invoice] = await prisma.$transaction([
      prisma.vendorInvoice.create({
        data: {
          organizationId: req.organizationId,
          purchaseOrderId: order.id,
          supplierId: order.supplierId,
          grnId: grnId || order.goodsReceivedNotes[0]?.id || null,
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          dueDate: calcDueDate,
          subtotal: parseFloat(subtotal || order.subtotal),
          taxAmount: parseFloat(taxAmount || order.taxAmount),
          totalAmount: billedTotal,
          status: "SUBMITTED",
          threeWayMatchStatus,
          accountantRemarks,
        },
        include: { supplier: true, purchaseOrder: true },
      }),
      prisma.purchaseOrder.update({
        where: { id: order.id },
        data: { status: "INVOICE_SUBMITTED" },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "SUBMIT_INVOICE",
      entityType: "VENDOR_INVOICE",
      entityId: invoice.id,
      newValues: { invoiceNumber, totalAmount: billedTotal, threeWayMatchStatus },
      ipAddress: req.ip,
    });

    // Notify Accountant
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "ACCOUNTANT"],
      `New Vendor Invoice: ${invoiceNumber}`,
      `Invoice for PO ${order.poNumber} submitted (₹${billedTotal.toFixed(2)}). 3-Way Match: ${threeWayMatchStatus}.`,
      "INFO"
    );

    return sendSuccess(res, invoice, "Vendor Invoice submitted successfully", 201);
  } catch (error) {
    console.error("submitVendorInvoice error:", error);
    return sendError(res, error.message || "Failed to submit Vendor Invoice", 500);
  }
};

/**
 * Review Vendor Invoice (Accountant Action: Approve or Reject)
 */
const reviewVendorInvoice = async (req, res) => {
  try {
    const { id } = req.params; // Invoice ID
    const { action, remarks, rejectionReason } = req.body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return sendError(res, "Action must be either APPROVE or REJECT", 400);
    }

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { purchaseOrder: true, supplier: true },
    });

    if (!invoice) {
      return sendError(res, "Vendor Invoice not found", 404);
    }

    if (action === "REJECT") {
      if (!rejectionReason) {
        return sendError(res, "Rejection reason is required", 400);
      }

      const [updatedInvoice] = await prisma.$transaction([
        prisma.vendorInvoice.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            rejectionReason,
            accountantRemarks: remarks,
          },
        }),
        prisma.purchaseOrder.update({
          where: { id: invoice.purchaseOrderId },
          data: { status: "INVOICE_REJECTED" },
        }),
      ]);

      await createAuditLog({
        userId: req.user.id,
        organizationId: req.organizationId,
        action: "REJECT_INVOICE",
        entityType: "VENDOR_INVOICE",
        entityId: id,
        newValues: { status: "REJECTED", rejectionReason },
        ipAddress: req.ip,
      });

      // Notify Supplier and Ops Manager
      await notifyRoles(
        req.organizationId,
        ["ADMIN", "MANAGER", "SUPPLIER"],
        `Invoice Rejected: ${invoice.invoiceNumber}`,
        `Reason: ${rejectionReason}. Accountant requested invoice correction.`,
        "ALERT"
      );

      return sendSuccess(res, updatedInvoice, "Vendor Invoice rejected");
    }

    // APPROVE INVOICE FOR PAYMENT
    const [updatedInvoice] = await prisma.$transaction([
      prisma.vendorInvoice.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          accountantRemarks: remarks || "3-Way Match verified and approved for disbursement",
        },
      }),
      prisma.purchaseOrder.update({
        where: { id: invoice.purchaseOrderId },
        data: { status: "PAYMENT_PENDING" },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "APPROVE_INVOICE",
      entityType: "VENDOR_INVOICE",
      entityId: id,
      newValues: { status: "APPROVED" },
      ipAddress: req.ip,
    });

    // Notify Ops Manager and Accountant team
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "MANAGER", "SUPPLIER"],
      `Invoice Approved: ${invoice.invoiceNumber}`,
      `Invoice of ₹${Number(invoice.totalAmount).toFixed(2)} approved. Scheduled for payment settlement.`,
      "SUCCESS"
    );

    return sendSuccess(res, updatedInvoice, "Vendor Invoice approved for payment");
  } catch (error) {
    console.error("reviewVendorInvoice error:", error);
    return sendError(res, "Failed to review Vendor Invoice", 500);
  }
};

/**
 * Record Payment against Approved Invoice (Accountant Action)
 */
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params; // Invoice ID
    const {
      amount,
      paymentDate = new Date(),
      paymentMethod = "BANK_TRANSFER",
      referenceNumber,
      remarks,
    } = req.body;

    const invoice = await prisma.vendorInvoice.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { purchaseOrder: true, supplier: true, payments: true },
    });

    if (!invoice) {
      return sendError(res, "Vendor Invoice not found", 404);
    }

    if (invoice.status !== "APPROVED" && invoice.status !== "PARTIALLY_PAID") {
      return sendError(res, `Cannot record payment for invoice in status ${invoice.status}`, 400);
    }

    const paymentAmount = parseFloat(amount || invoice.totalAmount);
    const existingPaid = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const newTotalPaid = existingPaid + paymentAmount;
    const isFullyPaid = newTotalPaid >= Number(invoice.totalAmount);

    const paymentNumber = await generateP2PCode("PAY-P2P", "p2PPayment", "paymentNumber", req.organizationId);

    // Also link with general Expense ledger for complete accounting integration
    const expenseNumber = await generateP2PCode("EXP", "expense", "expenseNumber", req.organizationId);

    const [payment] = await prisma.$transaction([
      prisma.p2PPayment.create({
        data: {
          organizationId: req.organizationId,
          vendorInvoiceId: invoice.id,
          purchaseOrderId: invoice.purchaseOrderId,
          paymentNumber,
          amount: paymentAmount,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          referenceNumber: referenceNumber || `REF-${Date.now()}`,
          status: "COMPLETED",
          remarks: remarks || "Procurement payment settled",
          paidBy: req.user.id,
        },
      }),
      prisma.vendorInvoice.update({
        where: { id },
        data: {
          status: isFullyPaid ? "PAID" : "PARTIALLY_PAID",
        },
      }),
      prisma.purchaseOrder.update({
        where: { id: invoice.purchaseOrderId },
        data: {
          status: isFullyPaid ? "COMPLETED" : "PARTIALLY_PAID",
        },
      }),
      prisma.expense.create({
        data: {
          organizationId: req.organizationId,
          expenseNumber,
          category: "RAW_MATERIALS_PROCUREMENT",
          amount: paymentAmount,
          expenseDate: new Date(paymentDate),
          description: `P2P Payment for PO ${invoice.purchaseOrder.poNumber} (${invoice.supplier.name})`,
          supplierId: invoice.supplierId,
          status: "PAID",
          createdBy: req.user.id,
          approvedBy: req.user.id,
          approvedAt: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      userId: req.user.id,
      organizationId: req.organizationId,
      action: "PROCESS_PAYMENT",
      entityType: "P2P_PAYMENT",
      entityId: payment.id,
      newValues: { paymentNumber, amount: paymentAmount, isFullyPaid, status: "COMPLETED" },
      ipAddress: req.ip,
    });

    // Notify Supplier, Store Manager, and Ops Manager
    await notifyRoles(
      req.organizationId,
      ["ADMIN", "SUPPLIER", "STORE_MANAGER", "MANAGER"],
      `Payment Completed: ₹${paymentAmount.toFixed(2)}`,
      `Payment ${paymentNumber} settled for Invoice ${invoice.invoiceNumber} (${invoice.supplier.name}). P2P Cycle ${isFullyPaid ? "COMPLETED" : "UPDATED"}.`,
      "SUCCESS"
    );

    return sendSuccess(
      res,
      { payment, isFullyPaid, cycleCompleted: isFullyPaid },
      "Payment processed successfully and P2P cycle updated",
      201
    );
  } catch (error) {
    console.error("recordPayment error:", error);
    return sendError(res, error.message || "Failed to record payment", 500);
  }
};

// ============================================================
// CROSS-ROLE P2P CYCLE TRACKER & DASHBOARD OVERVIEW
// ============================================================

/**
 * Get unified P2P Cycle Tracker for a given PR or PO ID
 */
const getCycleTracker = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by PO ID or Requisition ID
    let po = await prisma.purchaseOrder.findFirst({
      where: {
        OR: [{ id }, { requisitionId: id }, { poNumber: id }],
        organizationId: req.organizationId,
      },
      include: {
        supplier: true,
        items: true,
        challans: { include: { items: true } },
        goodsReceivedNotes: {
          include: {
            items: true,
            receiver: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
        },
        vendorInvoices: {
          include: {
            payments: {
              include: { payer: { select: { id: true, firstName: true, lastName: true } } },
            },
            reviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        requisition: {
          include: {
            items: true,
            requester: { select: { id: true, firstName: true, lastName: true } },
            rateFinalizer: { select: { id: true, firstName: true, lastName: true } },
            rejector: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        issuer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    let pr = null;
    if (!po) {
      pr = await prisma.purchaseRequisition.findFirst({
        where: {
          OR: [{ id }, { prNumber: id }],
          organizationId: req.organizationId,
        },
        include: {
          items: true,
          supplier: true,
          requester: { select: { id: true, firstName: true, lastName: true } },
          rateFinalizer: { select: { id: true, firstName: true, lastName: true } },
          rejector: { select: { id: true, firstName: true, lastName: true } },
          purchaseOrders: {
            include: {
              supplier: true,
              challans: true,
              goodsReceivedNotes: true,
              vendorInvoices: true,
            },
          },
        },
      });
      if (pr && pr.purchaseOrders && pr.purchaseOrders.length > 0) {
        po = await prisma.purchaseOrder.findUnique({
          where: { id: pr.purchaseOrders[0].id },
          include: {
            supplier: true,
            items: true,
            challans: true,
            goodsReceivedNotes: { include: { items: true, receiver: true } },
            vendorInvoices: { include: { payments: true, reviewer: true } },
            requisition: { include: { requester: true, rateFinalizer: true } },
            issuer: true,
          },
        });
      }
    }

    if (!po && !pr) {
      return sendError(res, "P2P Cycle record not found", 404);
    }

    const activeRecord = po || pr;
    const reqData = po?.requisition || pr;

    // Build Step Milestones
    const steps = [
      {
        stepIndex: 1,
        stepName: "Quantity Request (PR)",
        roleName: "Store Manager",
        roleKey: "store_manager",
        status: reqData
          ? reqData.status === "REJECTED"
            ? "REJECTED"
            : "COMPLETED"
          : "PENDING",
        code: reqData?.prNumber || "N/A",
        timestamp: reqData?.createdAt || null,
        actor: reqData?.requester
          ? `${reqData.requester.firstName} ${reqData.requester.lastName || ""}`.trim()
          : "Store Manager",
        details: reqData
          ? {
              title: reqData.title,
              priority: reqData.priority,
              estimatedTotal: reqData.estimatedTotal,
              itemCount: reqData.items?.length || 0,
            }
          : null,
      },
      {
        stepIndex: 2,
        stepName: "Rate Finalisation & Approval",
        roleName: "Operational Manager",
        roleKey: "manager",
        status: reqData
          ? reqData.status === "REJECTED"
            ? "REJECTED"
            : reqData.status === "PENDING_RATE_APPROVAL"
            ? "PENDING"
            : "COMPLETED"
          : "PENDING",
        timestamp: reqData?.rateFinalizedAt || reqData?.rejectedAt || null,
        actor: reqData?.rateFinalizer
          ? `${reqData.rateFinalizer.firstName} ${reqData.rateFinalizer.lastName || ""}`.trim()
          : reqData?.rejector
          ? `${reqData.rejector.firstName} ${reqData.rejector.lastName || ""}`.trim()
          : "Operational Manager",
        remarks: reqData?.rateApprovalRemarks || reqData?.rejectionReason || null,
        details: reqData?.finalizedTotal
          ? {
              finalizedTotal: reqData.finalizedTotal,
              supplierName: reqData.supplier?.name || po?.supplier?.name || "Assigned Supplier",
            }
          : null,
      },
      {
        stepIndex: 3,
        stepName: "PO Issuance, Challan & Out for Delivery",
        roleName: "Vendor / Supplier",
        roleKey: "supplier",
        status: !po
          ? "WAITING"
          : po.status === "VENDOR_REJECTED"
          ? "REJECTED"
          : ["OUT_FOR_DELIVERY", "GOODS_RECEIVED", "INVOICE_SUBMITTED", "INVOICE_APPROVED", "PAYMENT_PENDING", "COMPLETED", "PAID"].includes(po.status)
          ? "COMPLETED"
          : po.status === "VENDOR_ACCEPTED" || po.status === "CHALLAN_CREATED"
          ? "IN_PROGRESS"
          : "PENDING",
        code: po?.poNumber || "N/A",
        timestamp: po?.issuedAt || null,
        challanNumber: po?.challans?.[0]?.challanNumber || null,
        vehicleNumber: po?.challans?.[0]?.vehicleNumber || null,
        details: po
          ? {
              supplierName: po.supplier?.name,
              totalAmount: po.totalAmount,
              expectedDeliveryDate: po.expectedDeliveryDate,
              challanStatus: po.challans?.[0]?.status,
            }
          : null,
      },
      {
        stepIndex: 4,
        stepName: "Goods Received & Inspection (GRN)",
        roleName: "Store Manager",
        roleKey: "store_manager",
        status: !po
          ? "WAITING"
          : po.status === "GOODS_REJECTED"
          ? "REJECTED"
          : po.goodsReceivedNotes?.length > 0
          ? "COMPLETED"
          : po.status === "OUT_FOR_DELIVERY"
          ? "PENDING"
          : "WAITING",
        code: po?.goodsReceivedNotes?.[0]?.grnNumber || "N/A",
        timestamp: po?.goodsReceivedNotes?.[0]?.receivedDate || null,
        actor: po?.goodsReceivedNotes?.[0]?.receiver
          ? `${po.goodsReceivedNotes[0].receiver.firstName} ${po.goodsReceivedNotes[0].receiver.lastName || ""}`.trim()
          : "Store Manager",
        inventoryUpdated: po?.goodsReceivedNotes?.[0]?.inventoryUpdated || false,
        details: po?.goodsReceivedNotes?.[0]
          ? {
              grnNumber: po.goodsReceivedNotes[0].grnNumber,
              inspectionRemarks: po.goodsReceivedNotes[0].inspectionRemarks,
              grnStatus: po.goodsReceivedNotes[0].status,
              rejectionReason: po.goodsReceivedNotes[0].rejectionReason,
            }
          : null,
      },
      {
        stepIndex: 5,
        stepName: "Invoice, 3-Way Match & Payment",
        roleName: "Chief Accountant",
        roleKey: "accountant",
        status: !po
          ? "WAITING"
          : po.vendorInvoices?.[0]?.status === "REJECTED"
          ? "REJECTED"
          : po.status === "COMPLETED" || po.status === "PAID"
          ? "COMPLETED"
          : po.vendorInvoices?.[0]?.status === "APPROVED" || po.status === "PAYMENT_PENDING"
          ? "IN_PROGRESS"
          : po.vendorInvoices?.length > 0
          ? "PENDING"
          : "WAITING",
        invoiceNumber: po?.vendorInvoices?.[0]?.invoiceNumber || "N/A",
        paymentNumber: po?.vendorInvoices?.[0]?.payments?.[0]?.paymentNumber || null,
        paymentStatus: po?.vendorInvoices?.[0]?.status || "PENDING",
        details: po?.vendorInvoices?.[0]
          ? {
              invoiceNumber: po.vendorInvoices[0].invoiceNumber,
              threeWayMatchStatus: po.vendorInvoices[0].threeWayMatchStatus,
              totalAmount: po.vendorInvoices[0].totalAmount,
              paymentMethod: po.vendorInvoices[0].payments?.[0]?.paymentMethod,
              paymentRef: po.vendorInvoices[0].payments?.[0]?.referenceNumber,
            }
          : null,
      },
    ];

    return sendSuccess(
      res,
      {
        purchaseOrder: po,
        purchaseRequisition: reqData,
        overallStatus: po?.status || reqData?.status,
        steps,
      },
      "P2P Cycle Tracker retrieved"
    );
  } catch (error) {
    console.error("getCycleTracker error:", error);
    return sendError(res, "Failed to retrieve P2P Cycle Tracker", 500);
  }
};

/**
 * P2P Dashboard Stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const orgId = req.organizationId;

    const [
      totalRequisitions,
      pendingRateApproval,
      ratesFinalized,
      rejectedPRs,
      totalOrders,
      activePOs,
      outForDelivery,
      goodsReceived,
      pendingInvoices,
      completedPayments,
      totalSpendResult,
      suppliersCount,
    ] = await Promise.all([
      prisma.purchaseRequisition.count({ where: { organizationId: orgId } }),
      prisma.purchaseRequisition.count({ where: { organizationId: orgId, status: "PENDING_RATE_APPROVAL" } }),
      prisma.purchaseRequisition.count({ where: { organizationId: orgId, status: "RATES_FINALIZED" } }),
      prisma.purchaseRequisition.count({ where: { organizationId: orgId, status: "REJECTED" } }),
      prisma.purchaseOrder.count({ where: { organizationId: orgId } }),
      prisma.purchaseOrder.count({ where: { organizationId: orgId, status: { in: ["ISSUED", "VENDOR_ACCEPTED", "CHALLAN_CREATED"] } } }),
      prisma.purchaseOrder.count({ where: { organizationId: orgId, status: "OUT_FOR_DELIVERY" } }),
      prisma.purchaseOrder.count({ where: { organizationId: orgId, status: "GOODS_RECEIVED" } }),
      prisma.vendorInvoice.count({ where: { organizationId: orgId, status: "SUBMITTED" } }),
      prisma.p2PPayment.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
      prisma.p2PPayment.aggregate({
        where: { organizationId: orgId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.supplier.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    ]);

    const recentOrders = await prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const recentRequisitions = await prisma.purchaseRequisition.findMany({
      where: { organizationId: orgId },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return sendSuccess(res, {
      summary: {
        totalRequisitions,
        pendingRateApproval,
        ratesFinalized,
        rejectedPRs,
        totalOrders,
        activePOs,
        outForDelivery,
        goodsReceived,
        pendingInvoices,
        completedPayments,
        totalSpend: Number(totalSpendResult._sum.amount || 0),
        suppliersCount,
      },
      recentOrders,
      recentRequisitions,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return sendError(res, "Failed to retrieve P2P dashboard stats", 500);
  }
};

module.exports = {
  createRequisition,
  getRequisitions,
  getRequisitionById,
  finalizeRatesAndApprove,
  rejectRequisition,
  generatePurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  vendorAcceptOrder,
  vendorRejectOrder,
  createDeliveryChallan,
  markChallanOutForDelivery,
  processGoodsReceived,
  submitVendorInvoice,
  reviewVendorInvoice,
  recordPayment,
  getCycleTracker,
  getDashboardStats,
};
