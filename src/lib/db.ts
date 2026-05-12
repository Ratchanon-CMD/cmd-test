import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
  databaseReady?: Promise<void>;
};

function resolveDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL;

  if (process.env.VERCEL && (!configuredUrl || configuredUrl.startsWith("file:"))) {
    return "file:/tmp/cmd-registration.db";
  }

  return configuredUrl || "file:./dev.db";
}

const databaseUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

function isSqliteDatabase(): boolean {
  return databaseUrl.startsWith("file:");
}

const prismaClient =
  globalForPrisma.prismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prismaClient;
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!isSqliteDatabase()) {
    return;
  }

  if (!globalForPrisma.databaseReady) {
    globalForPrisma.databaseReady = (async () => {
      await prismaClient.$executeRawUnsafe("PRAGMA foreign_keys = ON");
      await prismaClient.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Registration" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "referenceCode" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "organization" TEXT,
          "jobTitle" TEXT,
          "dietaryRequirements" TEXT,
          "notes" TEXT,
          "passwordHash" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        )
      `);
      await prismaClient.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RegistrationDocument" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "registrationId" TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          "storagePath" TEXT NOT NULL,
          "mimeType" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RegistrationDocument_registrationId_fkey"
            FOREIGN KEY ("registrationId")
            REFERENCES "Registration" ("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        )
      `);
      await prismaClient.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Registration_referenceCode_key"
        ON "Registration"("referenceCode")
      `);
      await prismaClient.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "RegistrationDocument_registrationId_idx"
        ON "RegistrationDocument"("registrationId")
      `);
    })().catch((error) => {
      globalForPrisma.databaseReady = undefined;
      throw error;
    });
  }

  await globalForPrisma.databaseReady;
}

export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await ensureDatabaseReady();
        return query(args);
      }
    }
  }
});
