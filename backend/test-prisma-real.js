require('dotenv').config();
const prisma = require('./src/config/db');

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('Success:', users.length, 'users');
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
