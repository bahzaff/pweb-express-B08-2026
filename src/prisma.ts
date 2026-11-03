import 'dotenv/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set in environment variables.');
}

const adapter = connectionString
  ? new PrismaNeon({ connectionString })
  : undefined;

export const prisma = adapter
  ? new PrismaClient({ adapter })
  : new PrismaClient();

