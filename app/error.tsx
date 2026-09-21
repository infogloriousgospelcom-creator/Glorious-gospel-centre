"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
    <main id="main" className="container-page py-section text-center">
      <p className="eyebrow mb-3">Error</p>
      <h1 className="heading-1 mb-4">We couldn&apos;t load that page</h1>
      <p className="lead mx-auto mb-8 max-w-xl">
        Please try again. If the problem persists, contact the church office.
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Home</Button>
        </Link>
      </div>
    </main>
  );
}