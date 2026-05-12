import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export type SavedDocument = {
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
};

export type LoadedDocument = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

function uploadRoot(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    Number(value.size) > 0
  );
}

export async function saveUploadedDocuments(
  files: File[],
  referenceCode: string
): Promise<SavedDocument[]> {
  const saved: SavedDocument[] = [];
  const targetDirectory = path.join(uploadRoot(), referenceCode);
  await mkdir(targetDirectory, { recursive: true });

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File is too large: ${file.name}`);
    }

    const safeName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const absolutePath = path.join(targetDirectory, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    saved.push({
      fileName: file.name,
      storagePath: path.relative(uploadRoot(), absolutePath),
      mimeType: file.type,
      size: file.size
    });
  }

  return saved;
}

export async function removeStoredDocument(storagePath: string): Promise<void> {
  const absolutePath = path.join(uploadRoot(), storagePath);
  await rm(absolutePath, { force: true });
}

export async function loadStoredDocument(
  storagePath: string,
  fileName: string,
  mimeType: string
): Promise<LoadedDocument> {
  const absolutePath = path.join(uploadRoot(), storagePath);
  const buffer = await readFile(absolutePath);

  return {
    buffer,
    fileName,
    mimeType
  };
}
