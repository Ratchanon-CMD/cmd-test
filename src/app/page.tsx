import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="surface p-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
          CMD AI Adoption Exam 2026
        </p>
        <h1 className="max-w-3xl text-4xl font-bold text-slate-950">
          Event registration system
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Submit your registration, upload supporting documents, keep your
          reference code, and return later to edit your submission.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button-primary" href="/register">
            Start registration
          </Link>
          <Link className="button-secondary" href="/lookup">
            View or edit submission
          </Link>
        </div>
      </section>
      <aside className="surface p-6">
        <h2 className="text-lg font-bold text-slate-950">Admin tools</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Event staff can review all registrations and download printable name
          tag PDFs.
        </p>
        <Link className="button-secondary mt-6 w-full" href="/admin/login">
          Admin login
        </Link>
      </aside>
    </div>
  );
}
