const { PrismaClient } = require('@prisma/client');

// Force Prisma to use the runtime DATABASE_URL to avoid env resolution issues
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

module.exports = prisma;