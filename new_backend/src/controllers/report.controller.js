const prisma = require("../config/db");
const { sendError } = require("../utils/apiResponse");

const exportErpData = async (req, res) => {
  try {
    const [users, products, inventory] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: req.organizationId } }),
      prisma.product.findMany({ where: { organizationId: req.organizationId } }),
      prisma.inventory.findMany({ 
        where: { organizationId: req.organizationId },
        include: { product: true }
      })
    ]);

    let csv = 'Type,ID,Name,Status,Quantity,Role\n';

    users.forEach(u => {
      csv += `User,${u.id},${u.firstName} ${u.lastName},${u.status},,${u.role}\n`;
    });

    products.forEach(p => {
      csv += `Product,${p.id},${p.name},${p.status},,\n`;
    });

    inventory.forEach(i => {
      csv += `Inventory,${i.id},${i.product?.name},${i.product?.status},${i.quantity},\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="erp_export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export ERP Error:", error);
    sendError(res, "Failed to export ERP data", 500);
  }
};

module.exports = { exportErpData };
