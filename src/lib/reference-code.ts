import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferenceCode(date = new Date()): string {
  const year = date.getUTCFullYear();
  const bytes = randomBytes(6);
  let suffix = "";

  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }

  return `REG-${year}-${suffix}`;
}
