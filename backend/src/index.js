require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendError } = require('./utils/apiResponse');

// Route imports
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const managerAssignmentRoutes = require('./routes/managerAssignment.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base route to check if API is running
app.get('/api', (req, res) => {
  res.json({ message: 'AquaNexus API is running', version: '1.0' });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes); // Includes /api/users, /api/roles, /api/permissions
app.use('/api/manager-assignments', managerAssignmentRoutes);

// 404 handler
app.use((req, res) => {
  sendError(res, 'Route not found', 404);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  sendError(res, 'Internal server error', 500);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
