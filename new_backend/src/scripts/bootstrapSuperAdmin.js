require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

/**
 * Bootstrap / Recovery script for Aazira Solution's Platform Super Admin.
 * Initializes or updates the singleton Super Admin identity securely from environment variables.
 *
 * Environment variables:
 * - SUPER_ADMIN_EMAIL (required or defaults to platform owner email)
 * - SUPER_ADMIN_PASSWORD (required when initializing or resetting password)
 * - SUPER_ADMIN_USERNAME (optional, defaults to 'superadmin')
 * - SUPER_ADMIN_FIRST_NAME (optional, defaults to 'Aazira')
 * - SUPER_ADMIN_LAST_NAME (optional, defaults to 'SuperAdmin')
 */
async function bootstrapSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@aquanexus.com').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const username = (process.env.SUPER_ADMIN_USERNAME || 'superadmin').trim().toLowerCase();
  const firstName = (process.env.SUPER_ADMIN_FIRST_NAME || 'Aazira').trim();
  const lastName = (process.env.SUPER_ADMIN_LAST_NAME || 'Platform Owner').trim();

  console.log(`[Bootstrap] Checking Platform Super Admin account (${email})...`);

  try {
    // 1. Ensure SUPER_ADMIN role exists
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });
    if (!superAdminRole) {
      console.log('[Bootstrap] Creating SUPER_ADMIN role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Aazira Solution Platform Owner Super Admin',
        },
      });
    }

    // 2. Check if singleton super admin exists (via slot or isSuperAdmin)
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { isSuperAdmin: true },
          { superAdminSlot: 'SUPER_ADMIN' },
          { email: email },
        ],
      },
      include: {
        userRoles: true,
      },
    });

    if (existing) {
      console.log(`[Bootstrap] Found existing Super Admin account: id=${existing.id}, email=${existing.email}`);
      const updateData = {
        isSuperAdmin: true,
        superAdminSlot: 'SUPER_ADMIN',
        organizationId: null, // Platform Super Admin must never be bound to a single tenant
        status: 'ACTIVE',
        firstName: existing.firstName || firstName,
        lastName: existing.lastName || lastName,
      };

      if (password) {
        console.log('[Bootstrap] Updating password from SUPER_ADMIN_PASSWORD env var...');
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: updateData,
      });

      // Ensure user has SUPER_ADMIN role
      const hasRole = existing.userRoles.some((ur) => ur.roleId === superAdminRole.id);
      if (!hasRole) {
        await prisma.userRole.create({
          data: {
            userId: updated.id,
            roleId: superAdminRole.id,
          },
        });
      }

      console.log('[Bootstrap] Super Admin account is healthy and verified.');
      return updated;
    }

    // If not found, password is required to create initial account
    if (!password) {
      throw new Error(
        'SUPER_ADMIN_PASSWORD environment variable is required to initialize a new Super Admin account',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        status: 'ACTIVE',
        isSuperAdmin: true,
        superAdminSlot: 'SUPER_ADMIN',
        organizationId: null,
        userRoles: {
          create: {
            roleId: superAdminRole.id,
          },
        },
      },
    });

    console.log(`[Bootstrap] Platform Super Admin account initialized successfully: ${newAdmin.email}`);
    return newAdmin;
  } catch (error) {
    console.error('[Bootstrap] Failed to bootstrap Super Admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  bootstrapSuperAdmin()
    .then(() => {
      console.log('[Bootstrap] Done.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { bootstrapSuperAdmin };
