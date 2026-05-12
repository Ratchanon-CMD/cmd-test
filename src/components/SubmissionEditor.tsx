"use client";

import { FormEvent, useState } from "react";

import type { RegistrationView } from "@/lib/types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
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

export function SubmissionEditor({
  initialRegistration
}: {
  initialRegistration: RegistrationView;
}) {
  const [registration, setRegistration] = useState(initialRegistration);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/submissions/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        organization: formData.get("organization"),
        jobTitle: formData.get("jobTitle"),
        dietaryRequirements: formData.get("dietaryRequirements"),
        notes: formData.get("notes")
      })
    });
    const payload = (await response.json()) as ApiResponse<RegistrationView>;

    setIsSaving(false);

    if (!response.ok || !payload.success) {
      setError(payload.message || "Could not update submission");
      return;
    }

    setRegistration(payload.data);
    setMessage("Submission updated");
  }

  async function handleDocumentsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsUploading(true);
    setMessage("");
    setError("");

    const formData = new FormData(form);
    const response = await fetch("/api/submissions/me/documents", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as ApiResponse<RegistrationView>;

    setIsUploading(false);

    if (!response.ok || !payload.success) {
      setError(payload.message || "Could not update documents");
      return;
    }

    form.reset();
    setRegistration(payload.data);
    setMessage("Documents updated");
  }

  async function handleLogout() {
    await fetch("/api/submissions/logout", { method: "POST" });
    window.location.href = "/lookup";
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <section className="surface p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Reference code
            </p>
            <h1 className="text-2xl font-bold text-slate-950">
              {registration.referenceCode}
            </h1>
          </div>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <form className="grid gap-5" onSubmit={handleDetailsSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="field-label">Full name</span>
              <input
                className="field-input"
                name="name"
                defaultValue={registration.name}
                required
              />
            </label>
            <label>
              <span className="field-label">Email</span>
              <input
                className="field-input"
                name="email"
                type="email"
                defaultValue={registration.email}
                required
              />
            </label>
            <label>
              <span className="field-label">Phone</span>
              <input
                className="field-input"
                name="phone"
                defaultValue={registration.phone}
                required
              />
            </label>
            <label>
              <span className="field-label">Organization</span>
              <input
                className="field-input"
                name="organization"
                defaultValue={registration.organization ?? ""}
              />
            </label>
            <label>
              <span className="field-label">Job title</span>
              <input
                className="field-input"
                name="jobTitle"
                defaultValue={registration.jobTitle ?? ""}
              />
            </label>
            <label>
              <span className="field-label">Dietary requirements</span>
              <input
                className="field-input"
                name="dietaryRequirements"
                defaultValue={registration.dietaryRequirements ?? ""}
              />
            </label>
          </div>
          <label>
            <span className="field-label">Notes</span>
            <textarea
              className="field-input min-h-24"
              name="notes"
              defaultValue={registration.notes ?? ""}
            />
          </label>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          ) : null}
          <button className="button-primary w-full md:w-fit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      <aside className="surface p-6">
        <h2 className="text-xl font-bold text-slate-950">Documents</h2>
        <div className="mt-4 grid gap-3">
          {registration.documents.length ? (
            registration.documents.map((document) => (
              <a
                className="rounded-lg border border-slate-200 p-3 text-sm hover:border-slate-400"
                href={`/api/documents/${document.id}`}
                key={document.id}
              >
                <span className="block font-semibold text-slate-950">
                  {document.fileName}
                </span>
                <span className="text-slate-500">
                  {document.mimeType} · {formatBytes(document.size)}
                </span>
              </a>
            ))
          ) : (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          )}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleDocumentsSubmit}>
          <label>
            <span className="field-label">Add or replace documents</span>
            <input
              className="field-input"
              name="documents"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              multiple
              required
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input name="replaceExisting" type="checkbox" value="true" />
            Replace all existing documents
          </label>
          <button className="button-secondary" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Update documents"}
          </button>
        </form>
      </aside>
    </div>
  );
}
