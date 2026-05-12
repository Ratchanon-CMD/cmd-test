import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "crypto";

import { del, get, list, put, type BlobAccessType } from "@vercel/blob";
import type { Prisma } from "@prisma/client";

import {
  loadStoredDocument,
  removeStoredDocument,
  saveUploadedDocuments,
} from "@/lib/files";
import { hashPassword } from "@/lib/password";
import { generateReferenceCode } from "@/lib/reference-code";
import type { DocumentView, RegistrationView } from "@/lib/types";
import type {
  RegistrationInput,
  RegistrationUpdateInput,
} from "@/lib/validation";

const BLOB_REGISTRATION_PREFIX = "registrations/";
const BLOB_DOCUMENT_PREFIX = "documents/";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ENCRYPTED_PAYLOAD_VERSION = 1;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type PrismaRegistrationWithDocuments = Prisma.RegistrationGetPayload<{
  include: {
    documents: true;
  };
}>;

export type StoredDocumentView = DocumentView & {
  storagePath: string;
};

export type StoredRegistration = Omit<RegistrationView, "documents"> & {
  passwordHash: string;
  documents: StoredDocumentView[];
};

export type RegistrationDocumentDownload = {
  registration: StoredRegistration;
  document: StoredDocumentView;
  buffer: Buffer;
};

type RegistrationDocumentLookup = {
  registration: StoredRegistration;
  document: StoredDocumentView;
};

type BlobDownload = {
  statusCode: 200;
  stream: ReadableStream<Uint8Array>;
};

type EncryptedPayload = {
  version: typeof ENCRYPTED_PAYLOAD_VERSION;
  iv: string;
  tag: string;
  data: string;
};

let resolvedBlobAccess: BlobAccessType | null = null;

export function isBlobStoreEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isEphemeralVercelStorage(): boolean {
  return Boolean(process.env.VERCEL) && !isBlobStoreEnabled();
}

export function serializeStoredRegistration(
  registration: StoredRegistration,
): RegistrationView {
  return {
    id: registration.id,
    referenceCode: registration.referenceCode,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    organization: registration.organization,
    jobTitle: registration.jobTitle,
    dietaryRequirements: registration.dietaryRequirements,
    notes: registration.notes,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    documents: registration.documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: document.size,
      uploadedAt: document.uploadedAt,
    })),
  };
}

export async function createRegistration(
  input: RegistrationInput,
  files: File[],
): Promise<RegistrationView> {
  if (isBlobStoreEnabled()) {
    const registration = await createBlobRegistration(input, files);
    return serializeStoredRegistration(registration);
  }

  const registration = await createLocalRegistration(input, files);
  return serializeStoredRegistration(registration);
}

export async function findRegistrationByReferenceCode(
  referenceCode: string,
): Promise<StoredRegistration | null> {
  const normalizedReferenceCode = referenceCode.trim().toUpperCase();

  if (isBlobStoreEnabled()) {
    return findBlobRegistrationByReferenceCode(normalizedReferenceCode);
  }

  const { prisma } = await import("@/lib/db");
  const registration = await prisma.registration.findUnique({
    where: {
      referenceCode: normalizedReferenceCode,
    },
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  return registration ? mapPrismaRegistration(registration) : null;
}

export async function findRegistrationById(
  id: string,
): Promise<StoredRegistration | null> {
  if (isBlobStoreEnabled()) {
    return findBlobRegistrationById(id);
  }

  const { prisma } = await import("@/lib/db");
  const registration = await prisma.registration.findUnique({
    where: {
      id,
    },
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  return registration ? mapPrismaRegistration(registration) : null;
}

export async function listRegistrations(
  query?: string,
): Promise<StoredRegistration[]> {
  if (isBlobStoreEnabled()) {
    return listBlobRegistrations(query);
  }

  const { prisma } = await import("@/lib/db");
  const trimmedQuery = query?.trim();
  const registrations = await prisma.registration.findMany({
    where: trimmedQuery
      ? {
          OR: [
            { referenceCode: { contains: trimmedQuery } },
            { name: { contains: trimmedQuery } },
            { email: { contains: trimmedQuery } },
          ],
        }
      : undefined,
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return registrations.map(mapPrismaRegistration);
}

export async function updateRegistrationByReferenceCode(
  referenceCode: string,
  input: RegistrationUpdateInput,
): Promise<RegistrationView | null> {
  if (isBlobStoreEnabled()) {
    const registration = await updateBlobRegistrationByReferenceCode(
      referenceCode,
      input,
    );
    return registration ? serializeStoredRegistration(registration) : null;
  }

  const { prisma } = await import("@/lib/db");
  const registration = await prisma.registration.update({
    where: {
      referenceCode,
    },
    data: input,
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  return serializeStoredRegistration(mapPrismaRegistration(registration));
}

export async function updateRegistrationDocuments(
  referenceCode: string,
  files: File[],
  replaceExisting: boolean,
): Promise<RegistrationView | null> {
  if (isBlobStoreEnabled()) {
    const registration = await updateBlobRegistrationDocuments(
      referenceCode,
      files,
      replaceExisting,
    );
    return registration ? serializeStoredRegistration(registration) : null;
  }

  const { prisma } = await import("@/lib/db");
  const existingRegistration = await prisma.registration.findUnique({
    where: { referenceCode },
    include: { documents: true },
  });

  if (!existingRegistration) {
    return null;
  }

  const savedDocuments = await saveUploadedDocuments(files, referenceCode);

  if (replaceExisting) {
    await Promise.all(
      existingRegistration.documents.map((document) =>
        removeStoredDocument(document.storagePath),
      ),
    );
    await prisma.registrationDocument.deleteMany({
      where: {
        registrationId: existingRegistration.id,
      },
    });
  }

  const registration = await prisma.registration.update({
    where: { referenceCode },
    data: {
      documents: {
        create: savedDocuments,
      },
    },
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  return serializeStoredRegistration(mapPrismaRegistration(registration));
}

export async function findRegistrationDocument(
  documentId: string,
): Promise<RegistrationDocumentLookup | null> {
  if (isBlobStoreEnabled()) {
    return findBlobRegistrationDocument(documentId);
  }

  const { prisma } = await import("@/lib/db");
  const document = await prisma.registrationDocument.findUnique({
    where: { id: documentId },
    include: {
      registration: {
        include: {
          documents: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!document) {
    return null;
  }

  return {
    registration: mapPrismaRegistration(document.registration),
    document: mapPrismaDocument(document),
  };
}

export async function loadRegistrationDocument(
  documentId: string,
): Promise<RegistrationDocumentDownload | null> {
  const lookup = await findRegistrationDocument(documentId);

  if (!lookup) {
    return null;
  }

  if (isBlobStoreEnabled()) {
    const blob = await getBlob(lookup.document.storagePath, {
      useCache: false,
    });

    if (!blob || blob.statusCode !== 200) {
      return null;
    }

    return {
      ...lookup,
      buffer: decryptBuffer(await streamToBuffer(blob.stream)),
    };
  }

  const loaded = await loadStoredDocument(
    lookup.document.storagePath,
    lookup.document.fileName,
    lookup.document.mimeType,
  );

  return {
    ...lookup,
    buffer: loaded.buffer,
  };
}

function mapPrismaRegistration(
  registration: PrismaRegistrationWithDocuments,
): StoredRegistration {
  return {
    id: registration.id,
    referenceCode: registration.referenceCode,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    organization: registration.organization,
    jobTitle: registration.jobTitle,
    dietaryRequirements: registration.dietaryRequirements,
    notes: registration.notes,
    passwordHash: registration.passwordHash,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
    documents: registration.documents.map(mapPrismaDocument),
  };
}

function mapPrismaDocument(
  document: Prisma.RegistrationDocumentGetPayload<Record<string, never>>,
): StoredDocumentView {
  return {
    id: document.id,
    fileName: document.fileName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt.toISOString(),
  };
}

async function createLocalRegistration(
  input: RegistrationInput,
  files: File[],
): Promise<StoredRegistration> {
  const { Prisma: PrismaRuntime } = await import("@prisma/client");
  const { prisma } = await import("@/lib/db");
  const passwordHash = await hashPassword(input.password);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();
    const savedDocuments = await saveUploadedDocuments(files, referenceCode);

    try {
      const registration = await prisma.registration.create({
        data: {
          referenceCode,
          name: input.name,
          email: input.email,
          phone: input.phone,
          organization: input.organization,
          jobTitle: input.jobTitle,
          dietaryRequirements: input.dietaryRequirements,
          notes: input.notes,
          passwordHash,
          documents: {
            create: savedDocuments,
          },
        },
        include: {
          documents: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      });

      return mapPrismaRegistration(registration);
    } catch (error) {
      if (
        error instanceof PrismaRuntime.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not generate a unique reference code");
}

function blobAccess(): BlobAccessType {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

function isPublicStoreAccessError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Cannot use private access on a public store")
  );
}

async function withBlobAccess<T>(
  operation: (access: BlobAccessType) => Promise<T>,
): Promise<T> {
  const preferredAccess = resolvedBlobAccess ?? blobAccess();

  try {
    const result = await operation(preferredAccess);
    resolvedBlobAccess = preferredAccess;
    return result;
  } catch (error) {
    if (preferredAccess === "private" && isPublicStoreAccessError(error)) {
      resolvedBlobAccess = "public";
      return operation("public");
    }

    throw error;
  }
}

async function getBlob(
  pathname: string,
  options: { useCache?: boolean } = {},
): Promise<BlobDownload | null> {
  return withBlobAccess(async (access) => {
    if (access === "public") {
      return getPublicBlobByPathname(pathname);
    }

    const blob = await get(pathname, {
      access,
      useCache: options.useCache,
    });

    if (!blob || blob.statusCode !== 200) {
      return null;
    }

    return {
      statusCode: 200,
      stream: blob.stream,
    };
  });
}

async function putBlob(
  pathname: string,
  body: Buffer | string,
  options: {
    allowOverwrite: boolean;
    contentType: string;
  },
): ReturnType<typeof put> {
  return withBlobAccess((access) =>
    put(pathname, body, {
      access,
      addRandomSuffix: false,
      allowOverwrite: options.allowOverwrite,
      contentType: options.contentType,
    }),
  );
}

async function getPublicBlobByPathname(
  pathname: string,
): Promise<BlobDownload | null> {
  const page = await list({
    prefix: pathname,
    limit: 10,
  });
  const blob = page.blobs.find((candidate) => candidate.pathname === pathname);

  if (!blob) {
    return null;
  }

  const response = await fetch(blob.url, {
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return null;
  }

  return {
    statusCode: 200,
    stream: response.body,
  };
}

function blobRegistrationPath(id: string): string {
  return `${BLOB_REGISTRATION_PREFIX}${id}.json`;
}

async function createBlobRegistration(
  input: RegistrationInput,
  files: File[],
): Promise<StoredRegistration> {
  const existingRegistrations = await listBlobRegistrations();
  const passwordHash = await hashPassword(input.password);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceCode = generateReferenceCode();

    if (
      existingRegistrations.some(
        (registration) => registration.referenceCode === referenceCode,
      )
    ) {
      continue;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const registration: StoredRegistration = {
      id,
      referenceCode,
      name: input.name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      jobTitle: input.jobTitle,
      dietaryRequirements: input.dietaryRequirements,
      notes: input.notes,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      documents: await saveBlobUploadedDocuments(files, id),
    };

    await saveBlobRegistration(registration, false);
    return registration;
  }

  throw new Error("Could not generate a unique reference code");
}

async function listBlobRegistrationPathnames(): Promise<string[]> {
  const pathnames: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix: BLOB_REGISTRATION_PREFIX,
      limit: 1000,
      cursor,
    });
    pathnames.push(
      ...page.blobs
        .map((blob) => blob.pathname)
        .filter((pathname) => pathname.endsWith(".json")),
    );
    cursor = page.cursor;
  } while (cursor);

  return pathnames;
}

async function listBlobRegistrations(
  query?: string,
): Promise<StoredRegistration[]> {
  const pathnames = await listBlobRegistrationPathnames();
  const results = await Promise.allSettled(
    pathnames.map((pathname) => getBlobJson(pathname)),
  );
  const registrations = results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      console.warn(
        `Skipping unreadable registration blob: ${pathnames[index]}`,
        result.reason,
      );
      return null;
    })
    .filter((registration): registration is StoredRegistration =>
      Boolean(registration),
    );
  const normalizedQuery = query?.trim().toLowerCase();
  const filteredRegistrations = normalizedQuery
    ? registrations.filter((registration) =>
        [
          registration.referenceCode,
          registration.name,
          registration.email,
        ].some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    : registrations;

  return filteredRegistrations.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

async function findBlobRegistrationByReferenceCode(
  referenceCode: string,
): Promise<StoredRegistration | null> {
  const registrations = await listBlobRegistrations();
  return (
    registrations.find(
      (registration) => registration.referenceCode === referenceCode,
    ) ?? null
  );
}

async function findBlobRegistrationById(
  id: string,
): Promise<StoredRegistration | null> {
  return getBlobJson(blobRegistrationPath(id));
}

async function updateBlobRegistrationByReferenceCode(
  referenceCode: string,
  input: RegistrationUpdateInput,
): Promise<StoredRegistration | null> {
  const registration = await findBlobRegistrationByReferenceCode(referenceCode);

  if (!registration) {
    return null;
  }

  const updatedRegistration: StoredRegistration = {
    ...registration,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  await saveBlobRegistration(updatedRegistration, true);

  return updatedRegistration;
}

async function updateBlobRegistrationDocuments(
  referenceCode: string,
  files: File[],
  replaceExisting: boolean,
): Promise<StoredRegistration | null> {
  const registration = await findBlobRegistrationByReferenceCode(referenceCode);

  if (!registration) {
    return null;
  }

  const newDocuments = await saveBlobUploadedDocuments(files, registration.id);
  const documents = replaceExisting
    ? newDocuments
    : [...newDocuments, ...registration.documents];

  if (replaceExisting && registration.documents.length > 0) {
    await del(registration.documents.map((document) => document.storagePath));
  }

  const updatedRegistration: StoredRegistration = {
    ...registration,
    documents: documents.sort((left, right) =>
      right.uploadedAt.localeCompare(left.uploadedAt),
    ),
    updatedAt: new Date().toISOString(),
  };
  await saveBlobRegistration(updatedRegistration, true);

  return updatedRegistration;
}

async function findBlobRegistrationDocument(
  documentId: string,
): Promise<RegistrationDocumentLookup | null> {
  const registrations = await listBlobRegistrations();

  for (const registration of registrations) {
    const document = registration.documents.find(
      (candidate) => candidate.id === documentId,
    );

    if (document) {
      return {
        registration,
        document,
      };
    }
  }

  return null;
}

async function saveBlobRegistration(
  registration: StoredRegistration,
  allowOverwrite: boolean,
): Promise<void> {
  await putBlob(
    blobRegistrationPath(registration.id),
    encryptText(JSON.stringify(registration)),
    {
      allowOverwrite,
      contentType: "application/json",
    },
  );
}

async function getBlobJson(
  pathname: string,
): Promise<StoredRegistration | null> {
  const blob = await getBlob(pathname, {
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200) {
    return null;
  }

  return JSON.parse(
    decryptText((await streamToBuffer(blob.stream)).toString("utf8")),
  ) as StoredRegistration;
}

async function saveBlobUploadedDocuments(
  files: File[],
  registrationId: string,
): Promise<StoredDocumentView[]> {
  const documents: StoredDocumentView[] = [];

  for (const file of files) {
    validateUploadedFile(file);

    const id = randomUUID();
    const pathname = `${BLOB_DOCUMENT_PREFIX}${registrationId}/${id}-${sanitizeFileName(
      file.name,
    )}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await putBlob(pathname, encryptBuffer(buffer), {
      allowOverwrite: false,
      contentType: "application/octet-stream",
    });

    documents.push({
      id,
      fileName: file.name,
      storagePath: pathname,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  }

  return documents;
}

function validateUploadedFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large: ${file.name}`);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(process.env.SESSION_SECRET || "dev-only-session-secret-change-me")
    .digest();
}

function encryptBuffer(buffer: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const payload: EncryptedPayload = {
    version: ENCRYPTED_PAYLOAD_VERSION,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    data: encrypted.toString("base64url"),
  };

  return Buffer.from(JSON.stringify(payload), "utf8");
}

function decryptBuffer(buffer: Buffer): Buffer {
  const payload = parseEncryptedPayload(buffer.toString("utf8"));

  if (!payload) {
    return buffer;
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(payload.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64url")),
    decipher.final(),
  ]);
}

function encryptText(value: string): string {
  return encryptBuffer(Buffer.from(value, "utf8")).toString("utf8");
}

function decryptText(value: string): string {
  return decryptBuffer(Buffer.from(value, "utf8")).toString("utf8");
}

function parseEncryptedPayload(value: string): EncryptedPayload | null {
  try {
    const payload = JSON.parse(value) as Partial<EncryptedPayload>;

    if (
      payload.version !== ENCRYPTED_PAYLOAD_VERSION ||
      typeof payload.iv !== "string" ||
      typeof payload.tag !== "string" ||
      typeof payload.data !== "string"
    ) {
      return null;
    }

    return payload as EncryptedPayload;
  } catch {
    return null;
  }
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    byteLength += value.byteLength;
  }

  return Buffer.concat(chunks, byteLength);
}
