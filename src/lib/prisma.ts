import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, types } from "@neondatabase/serverless";

// @neondatabase/serverless@0.9.x parses TIMESTAMP columns into JavaScript Date
// objects by default. @prisma/adapter-neon@5.22.0 expects ISO strings — when it
// receives a Date object it spreads it as {...date} which yields {} (Date has no
// enumerable properties), causing P2023 "found {}". Override the parsers to
// return raw ISO strings so Prisma receives what it expects.
const toISO = (val: string) => new Date(val + "Z").toISOString();
types.setTypeParser(1114 as any, toISO); // TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1184 as any, (val: string) => new Date(val).toISOString()); // TIMESTAMPTZ

function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
