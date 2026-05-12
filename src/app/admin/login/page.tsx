import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminSessionSubject } from "@/lib/cookies";

export default function AdminLoginPage() {
  const admin = getAdminSessionSubject();

  if (admin) {
    redirect("/admin/registrations");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">Admin login</h1>
        <p className="mt-2 text-slate-600">
          Use the credentials configured in the environment.
        </p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
