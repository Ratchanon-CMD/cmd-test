import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "CMD Event Registration",
  description: "Event registration system for CMD AI Adoption Exam"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold text-slate-950">
              CMD Event Registration
            </Link>
            <nav className="flex gap-4 text-sm font-semibold text-slate-600">
              <Link href="/register">Register</Link>
              <Link href="/lookup">Lookup</Link>
              <Link href="/admin/login">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
