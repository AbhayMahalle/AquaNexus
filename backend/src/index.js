require("dotenv").config({
  path: process.env.DOTENV_CONFIG_PATH || ".env",
});
const express = require("express");
const cors = require("cors");
const { sendError } = require("./utils/apiResponse");

// Route imports
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const managerAssignmentRoutes = require("./routes/managerAssignment.routes");
const employeeRoutes = require("./routes/employee.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const leaveRoutes = require("./routes/leave.routes");
const overtimeRoutes = require("./routes/overtime.routes");
const productRoutes = require("./routes/product.routes");
const productionRoutes = require("./routes/production.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const distributionRoutes = require("./routes/distribution.routes");
const orderRoutes = require("./routes/order.routes");
const dispatchRoutes = require("./routes/dispatch.routes");
const financeRoutes = require("./routes/finance.routes");
const salesRoutes = require("./routes/sales.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base route to check if API is running
app.get("/api", (req, res) => {
  res.json({ message: "AquaNexus API is running", version: "1.0" });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api", adminRoutes); // Includes /api/users, /api/roles, /api/permissions
app.use("/api/manager-assignments", managerAssignmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/production", productionRoutes);
app.use("/api", inventoryRoutes); // Includes /api/inventory, /api/stock-transactions, /api/goods-received
app.use("/api", distributionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api", financeRoutes);
app.use("/api", salesRoutes);

// 404 handler
app.use((req, res) => {
  sendError(res, "Route not found", 404);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  sendError(res, "Internal server error", 500);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
