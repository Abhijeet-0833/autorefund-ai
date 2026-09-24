import { PrismaClient } from "@prisma/client";

function getSanitizedDbUrl(): string | undefined {
  let url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

export function getDbUrlStatus(): { exists: boolean; protocol: string } {
  const url = getSanitizedDbUrl() || "";
  if (!url) return { exists: false, protocol: "none" };
  if (url.startsWith("postgresql://")) return { exists: true, protocol: "postgresql" };
  if (url.startsWith("postgres://")) return { exists: true, protocol: "postgres" };
  if (url.startsWith("file:")) return { exists: true, protocol: "file" };
  return { exists: true, protocol: "invalid" };
}

const sanitizedUrl = getSanitizedDbUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(sanitizedUrl ? { datasources: { db: { url: sanitizedUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
