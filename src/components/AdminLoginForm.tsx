"use client";

import { FormEvent, useState } from "react";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function AdminLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });
    const payload = (await response.json()) as ApiResponse<unknown>;

    setIsSubmitting(false);

    if (!response.ok || !payload.success) {
      setError(payload.message || "Could not log in");
      return;
    }

    window.location.href = "/admin/registrations";
  }

  return (
    <form className="surface grid gap-5 p-6" onSubmit={handleSubmit}>
      <label>
        <span className="field-label">Username</span>
        <input className="field-input" name="username" required />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input className="field-input" name="password" type="password" required />
      </label>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <button className="button-primary" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
