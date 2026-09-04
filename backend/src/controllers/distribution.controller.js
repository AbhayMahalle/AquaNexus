const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  getAccessibleDistributorIds,
  isInternalRole,
} = require("../utils/distributorAccess");

const getSalesAreas = async (req, res) => {
  try {
    const distributorIds = getAccessibleDistributorIds(req);
    const where =
      distributorIds === null
        ? {}
        : { distributors: { some: { id: { in: distributorIds } } } };

    const salesAreas = await prisma.salesArea.findMany({
      where,
      include: { _count: { select: { distributors: true } } },
      orderBy: { name: "asc" },
    });

    return sendSuccess(
      res,
      { salesAreas },
      "Sales areas retrieved successfully",
    );
  } catch (error) {
    console.error("getSalesAreas error:", error);
    return sendError(res, "Failed to retrieve sales areas", 500);
  }
};

const createSalesArea = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return sendError(res, "Name and code are required", 400);
    }

    const salesArea = await prisma.salesArea.create({
      data: { name, code, description },
    });

    return sendSuccess(
      res,
      { salesArea },
      "Sales area created successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(
        res,
        "A sales area with this name or code already exists",
        409,
      );
    }
    console.error("createSalesArea error:", error);
    return sendError(res, "Failed to create sales area", 500);
  }
};

const getDistributors = async (req, res) => {
  try {
    const distributorIds = getAccessibleDistributorIds(req);
    const where = distributorIds === null ? {} : { id: { in: distributorIds } };

    const distributors = await prisma.distributor.findMany({
      where,
      include: { salesArea: true },
      orderBy: { name: "asc" },
    });

    return sendSuccess(
      res,
      { distributors },
      "Distributors retrieved successfully",
    );
  } catch (error) {
    console.error("getDistributors error:", error);
    return sendError(res, "Failed to retrieve distributors", 500);
  }
};

const createDistributor = async (req, res) => {
  try {
    const {
      distributorCode,
      name,
      email,
      phone,
      address,
      salesAreaId,
      creditLimit,
    } = req.body;
    if (!distributorCode || !name) {
      return sendError(res, "Distributor code and name are required", 400);
    }

    if (salesAreaId) {
      const salesArea = await prisma.salesArea.findUnique({
        where: { id: salesAreaId },
      });
      if (!salesArea) {
        return sendError(res, "Sales area not found", 400);
      }
    }

    const distributor = await prisma.distributor.create({
      data: {
        distributorCode,
        name,
        email,
        phone,
        address,
        salesAreaId,
        creditLimit,
      },
      include: { salesArea: true },
    });

    return sendSuccess(
      res,
      { distributor },
      "Distributor created successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, "A distributor with this code already exists", 409);
    }
    console.error("createDistributor error:", error);
    return sendError(res, "Failed to create distributor", 500);
  }
};

const getDistributorStock = async (req, res) => {
  try {
    const distributorIds = getAccessibleDistributorIds(req);
    const where =
      distributorIds === null ? {} : { distributorId: { in: distributorIds } };
    const stock = await prisma.distributorStock.findMany({
      where,
      include: { product: true, distributor: true },
      orderBy: [{ distributorId: "asc" }, { productId: "asc" }],
    });

    return sendSuccess(
      res,
      { stock },
      "Distributor stock retrieved successfully",
    );
  } catch (error) {
    console.error("getDistributorStock error:", error);
    return sendError(res, "Failed to retrieve distributor stock", 500);
  }
};

module.exports = {
  getSalesAreas,
  createSalesArea,
  getDistributors,
  createDistributor,
  getDistributorStock,
  isInternalRole,
};
