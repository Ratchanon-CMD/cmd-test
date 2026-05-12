import { redirect } from "next/navigation";

import { SubmissionEditor } from "@/components/SubmissionEditor";
import { getSubmissionReferenceFromSession } from "@/lib/cookies";
import { serializeRegistration } from "@/lib/serializers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SubmissionPage() {
  const referenceCode = getSubmissionReferenceFromSession();

  if (!referenceCode) {
    redirect("/lookup");
  }

  const { prisma } = await import("@/lib/db");
  const registration = await prisma.registration.findUnique({
    where: {
      referenceCode
    },
    include: {
      documents: {
        orderBy: {
          uploadedAt: "desc"
        }
      }
    }
  });

  if (!registration) {
    redirect("/lookup");
  }

  return <SubmissionEditor initialRegistration={serializeRegistration(registration)} />;
}
