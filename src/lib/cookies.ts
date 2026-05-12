import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  SUBMISSION_COOKIE,
  verifySessionToken
} from "@/lib/session";

export function getAdminSessionSubject(): string | null {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token, "admin")?.subject ?? null;
}

export function getSubmissionReferenceFromSession(): string | null {
  const token = cookies().get(SUBMISSION_COOKIE)?.value;
  return verifySessionToken(token, "submission")?.subject ?? null;
}
