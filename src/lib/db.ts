import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

function databaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL;

  if (!configuredUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return configuredUrl;
}

process.env.DATABASE_URL = databaseUrl();

const prismaClient =
  globalForPrisma.prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prismaClient;
}

export const prisma = prismaClient;
