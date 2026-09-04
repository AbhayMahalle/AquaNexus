const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userDistributors: {
          include: { distributor: true },
        },
        managerAssignments: true,
      },
    });

    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    const primaryRole = user.userRoles[0]?.role || null;
    if (!primaryRole) {
      return sendError(res, "User role not configured", 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: primaryRole?.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = primaryRole;

    return sendSuccess(
      res,
      {
        token,
        user: userWithoutPassword,
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "An error occurred during login", 500);
  }
};

const me = async (req, res) => {
  try {
    // req.user is attached by auth middleware
    const { passwordHash: _, ...userWithoutPassword } = req.user;
    return sendSuccess(
      res,
      { user: userWithoutPassword },
      "User retrieved successfully",
    );
  } catch (error) {
    console.error("Me error:", error);
    return sendError(res, "An error occurred fetching user data", 500);
  }
};

const logout = async (req, res) => {
  try {
    // With JWT, logout is mostly handled client-side by deleting the token.
    // We can just return success here.
    return sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return sendError(res, "An error occurred during logout", 500);
  }
};

module.exports = {
  login,
  me,
  logout,
};
