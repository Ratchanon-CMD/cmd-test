"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import type { RegistrationView } from "@/lib/types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState<RegistrationView | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError("");
    setRegistration(null);

    const formData = new FormData(form);
    const response = await fetch("/api/registrations", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as ApiResponse<RegistrationView>;

    setIsSubmitting(false);

    if (!response.ok || !payload.success) {
      setError(payload.message || "Could not submit registration");
      return;
    }

    form.reset();
    setRegistration(payload.data);
  }

  if (registration) {
    return (
      <div className="surface p-6">
        <h2 className="text-2xl font-bold text-slate-950">
          Registration submitted
        </h2>
        <p className="mt-3 text-slate-600">
          Keep this reference code. You will need it with your password to view
          or edit the submission.
        </p>
        <div className="mt-6 rounded-lg bg-slate-950 px-5 py-4 text-center text-2xl font-bold tracking-wide text-white">
          {registration.referenceCode}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/lookup" className="button-primary">
            View or edit submission
          </Link>
          <button
            className="button-secondary"
            type="button"
            onClick={() => setRegistration(null)}
          >
            Submit another registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="surface grid gap-5 p-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="field-label">Full name</span>
          <input className="field-input" name="name" required minLength={2} />
        </label>
        <label>
          <span className="field-label">Email</span>
          <input className="field-input" name="email" type="email" required />
        </label>
        <label>
          <span className="field-label">Phone</span>
          <input className="field-input" name="phone" required minLength={6} />
        </label>
        <label>
          <span className="field-label">Organization</span>
          <input className="field-input" name="organization" />
        </label>
        <label>
          <span className="field-label">Job title</span>
          <input className="field-input" name="jobTitle" />
        </label>
        <label>
          <span className="field-label">Dietary requirements</span>
          <input className="field-input" name="dietaryRequirements" />
        </label>
      </div>
      <label>
        <span className="field-label">Notes</span>
        <textarea className="field-input min-h-24" name="notes" />
      </label>
      <label>
        <span className="field-label">Supporting documents</span>
        <input
          className="field-input"
          name="documents"
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          multiple
        />
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          <span className="field-label">Password</span>
          <input
            className="field-input"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </label>
        <label>
          <span className="field-label">Confirm password</span>
          <input
            className="field-input"
            name="confirmPassword"
            type="password"
            minLength={8}
            required
          />
        </label>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <button className="button-primary w-full md:w-fit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit registration"}
      </button>
    </form>
  );
}
