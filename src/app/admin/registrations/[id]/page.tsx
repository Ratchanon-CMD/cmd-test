import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { getAdminSessionSubject } from "@/lib/cookies";
import { prisma } from "@/lib/db";

type PageProps = {
  params: {
    id: string;
  };
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminRegistrationDetailPage({ params }: PageProps) {
  const admin = getAdminSessionSubject();

  if (!admin) {
    redirect("/admin/login");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id: params.id
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
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            className="text-sm font-semibold text-blue-700"
            href="/admin/registrations"
          >
            Back to registrations
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            {registration.name}
          </h1>
          <p className="mt-1 font-semibold text-slate-500">
            {registration.referenceCode}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            className="button-primary"
            href={`/api/admin/registrations/${registration.id}/tag`}
          >
            Download PDF tag
          </a>
          <AdminLogoutButton />
        </div>
      </div>

      <section className="surface grid gap-5 p-6 md:grid-cols-2">
        <div>
          <p className="field-label">Email</p>
          <p className="font-semibold text-slate-950">{registration.email}</p>
        </div>
        <div>
          <p className="field-label">Phone</p>
          <p className="font-semibold text-slate-950">{registration.phone}</p>
        </div>
        <div>
          <p className="field-label">Organization</p>
          <p className="font-semibold text-slate-950">
            {registration.organization || "-"}
          </p>
        </div>
        <div>
          <p className="field-label">Job title</p>
          <p className="font-semibold text-slate-950">
            {registration.jobTitle || "-"}
          </p>
        </div>
        <div>
          <p className="field-label">Dietary requirements</p>
          <p className="font-semibold text-slate-950">
            {registration.dietaryRequirements || "-"}
          </p>
        </div>
        <div>
          <p className="field-label">Submitted</p>
          <p className="font-semibold text-slate-950">
            {registration.createdAt.toLocaleString()}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="field-label">Notes</p>
          <p className="whitespace-pre-wrap text-slate-700">
            {registration.notes || "-"}
          </p>
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-xl font-bold text-slate-950">Documents</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {registration.documents.map((document) => (
            <a
              className="rounded-lg border border-slate-200 p-4 hover:border-slate-400"
              href={`/api/documents/${document.id}`}
              key={document.id}
            >
              <span className="block font-semibold text-slate-950">
                {document.fileName}
              </span>
              <span className="text-sm text-slate-500">
                {document.mimeType} · {formatBytes(document.size)}
              </span>
            </a>
          ))}
          {registration.documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
