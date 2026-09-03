"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="container-page py-24 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-red-600">
          Something went wrong
        </p>
        <h1 className="heading-1 mb-4">          We couldn&apos;t load that page</h1>
        <p className="lead mx-auto mb-8 max-w-xl">
          Please try again. If the problem persists, contact the church office.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-medium text-white hover:bg-brand-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-brand-200 px-5 py-3 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
