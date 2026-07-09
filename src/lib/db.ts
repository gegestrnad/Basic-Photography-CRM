import { PrismaClient } from '@prisma/client'

// Prevent multiple PrismaClient instances during Next.js hot-reloading in dev,
// and across serverless function invocations on Vercel.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Disable query logging in production — it slows down serverless cold
    // starts and clutters Vercel function logs.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

// Cache the instance globally so we don't create a new PrismaClient on every
// hot-reload (dev) or every serverless invocation (Vercel).
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db