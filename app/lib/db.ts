import { PrismaClient } from '@prisma/client';

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma:
  | PrismaClient
  = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'error', 'warn'].filter(Boolean) as any,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;


