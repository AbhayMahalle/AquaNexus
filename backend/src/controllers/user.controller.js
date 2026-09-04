const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const userInclude = {
  userRoles: { include: { role: true } },
  managerAssignments: true,
};

const formatUser = (user) => {
  const { passwordHash, userRoles, ...safeUser } = user;
  return {
    ...safeUser,
    role: userRoles[0]?.role || null,
  };
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(
      res,
      { users: users.map(formatUser) },
      "Users retrieved successfully",
    );
  } catch (error) {
    console.error("getUsers error:", error);
    return sendError(res, "Failed to retrieve users", 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, roleId } =
      req.body;
    if (!email || !password || !firstName || !lastName || !roleId) {
      return sendError(
        res,
        "Email, password, names, and role ID are required",
        400,
      );
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return sendError(res, "Role not found", 400);
    }

    const user = await prisma.user.create({
      data: {
        username: username || email.split("@")[0],
        email,
        passwordHash: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        phone,
        userRoles: { create: { roleId } },
      },
      include: userInclude,
    });

    return sendSuccess(
      res,
      { user: formatUser(user) },
      "User created successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(
        res,
        "A user with this username or email already exists",
        409,
      );
    }
    console.error("createUser error:", error);
    return sendError(res, "Failed to create user", 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, phone, roleId, password } =
      req.body;
    const data = { username, email, firstName, lastName, phone };
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.$transaction(async (transaction) => {
      if (roleId) {
        const role = await transaction.role.findUnique({
          where: { id: roleId },
        });
        if (!role) {
          const error = new Error("Role not found");
          error.statusCode = 400;
          throw error;
        }
        await transaction.userRole.deleteMany({ where: { userId: id } });
        await transaction.userRole.create({ data: { userId: id, roleId } });
      }

      return transaction.user.update({
        where: { id },
        data,
        include: userInclude,
      });
    });

    return sendSuccess(
      res,
      { user: formatUser(user) },
      "User updated successfully",
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === "P2002") {
      return sendError(
        res,
        "A user with this username or email already exists",
        409,
      );
    }
    console.error("updateUser error:", error);
    return sendError(res, "Failed to update user", 500);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};
