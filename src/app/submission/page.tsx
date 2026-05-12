import { redirect } from "next/navigation";

import { SubmissionEditor } from "@/components/SubmissionEditor";
import { getSubmissionReferenceFromSession } from "@/lib/cookies";
import {
  findRegistrationByReferenceCode,
  serializeStoredRegistration,
} from "@/lib/registration-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SubmissionPage() {
  const referenceCode = getSubmissionReferenceFromSession();

  if (!referenceCode) {
    redirect("/lookup");
  }

  const registration = await findRegistrationByReferenceCode(referenceCode);

  if (!registration) {
    redirect("/lookup");
  }

  return (
    <SubmissionEditor
      initialRegistration={serializeStoredRegistration(registration)}
    />
  );
}
