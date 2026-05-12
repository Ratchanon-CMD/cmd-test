import { LookupForm } from "@/components/LookupForm";

export default function LookupPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-950">
          View or edit submission
        </h1>
        <p className="mt-2 text-slate-600">
          Enter your reference code and password to continue.
        </p>
      </div>
      <LookupForm />
    </div>
  );
}
