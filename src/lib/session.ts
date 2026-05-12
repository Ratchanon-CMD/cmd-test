import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "admin_session";
export const SUBMISSION_COOKIE = "submission_session";

export type SessionKind = "admin" | "submission";

type SessionPayload = {
  kind: SessionKind;
  subject: string;
  exp: number;
};

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-only-session-secret-change-me";
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(
  kind: SessionKind,
  subject: string,
  ttlSeconds: number
): string {
  const payload: SessionPayload = {
    kind,
    subject,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(
  token: string | undefined,
  expectedKind: SessionKind
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!signaturesMatch(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.kind !== expectedKind || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
