import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { getAdminSessionSubject } from "@/lib/cookies";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: {
    q?: string;
  };
};

export default async function AdminRegistrationsPage({
  searchParams,
}: PageProps) {
  const admin = getAdminSessionSubject();

  if (!admin) {
    redirect("/admin/login");
  }

  const query = searchParams.q?.trim();
  const registrations = await prisma.registration.findMany({
    where: query
      ? {
          OR: [
            { referenceCode: { contains: query } },
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : undefined,
    include: {
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Registrations</h1>
          <p className="mt-2 text-slate-600">
            Review submissions, open details, and download name tags.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <form
        className="surface flex flex-col gap-3 p-4 md:flex-row"
        action="/admin/registrations"
      >
        <input
          className="field-input"
          name="q"
          placeholder="Search by name, email, or reference code"
          defaultValue={query ?? ""}
        />
        <button className="button-primary md:w-32">Search</button>
      </form>

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr className="border-b border-slate-100" key={registration.id}>
                  <td className="px-4 py-3 font-semibold text-slate-950">
                    {registration.referenceCode}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-slate-950">
                      {registration.name}
                    </span>
                    <span className="text-slate-500">
                      {registration.organization || "No organization"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="block">{registration.email}</span>
                    <span className="block">{registration.phone}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {registration.documents.length}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {registration.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        className="button-secondary py-2 text-xs"
                        href={`/admin/registrations/${registration.id}`}
                      >
                        Details
                      </Link>
                      <a
                        className="button-primary py-2 text-xs"
                        href={`/api/admin/registrations/${registration.id}/tag`}
                      >
                        PDF tag
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-slate-500"
                    colSpan={6}
                  >
                    No registrations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
