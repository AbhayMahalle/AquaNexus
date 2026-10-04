require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds before Supabase pooler drops them
  connectionTimeoutMillis: 10000, // 10s connection timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  // Evict faulted or timed-out sockets gracefully without crashing
  console.warn('PostgreSQL pool notice (evicted idle/stale client):', err.message);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Initial DB connection warning:', err.message));

module.exports = prisma;
