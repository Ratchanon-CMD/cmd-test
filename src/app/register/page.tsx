import { RegistrationForm } from "@/components/RegistrationForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">Register</h1>
        <p className="mt-2 text-slate-600">
          Complete the form and upload any supporting documents for the event
          team to review.
        </p>
      </div>
      <RegistrationForm />
    </div>
  );
}
