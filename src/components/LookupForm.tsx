"use client";

import { FormEvent, useState } from "react";

import { SubmissionEditor } from "@/components/SubmissionEditor";
import type { RegistrationView } from "@/lib/types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function LookupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState<RegistrationView | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setRegistration(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/submissions/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceCode: formData.get("referenceCode"),
          password: formData.get("password"),
        }),
      });
      const payload = (await response.json()) as ApiResponse<RegistrationView>;

      if (!response.ok || !payload.success) {
        setError(payload.message || "Could not unlock submission");
        return;
      }

      setRegistration(payload.data);
    } catch {
      setError("Could not unlock submission");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registration) {
    return <SubmissionEditor initialRegistration={registration} />;
  }

  return (
    <form className="surface grid max-w-xl gap-5 p-6" onSubmit={handleSubmit}>
      <label>
        <span className="field-label">Reference code</span>
        <input
          className="field-input uppercase"
          name="referenceCode"
          placeholder="REG-2026-ABC123"
          required
        />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input
          className="field-input"
          name="password"
          type="password"
          required
        />
      </label>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <button className="button-primary" disabled={isSubmitting}>
        {isSubmitting ? "Checking..." : "View submission"}
      </button>
    </form>
  );
}
