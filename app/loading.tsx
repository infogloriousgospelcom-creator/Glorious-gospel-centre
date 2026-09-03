import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="container-page py-16" aria-busy="true" aria-live="polite">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-brand-100" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-brand-100" />
          <div className="h-4 w-full animate-pulse rounded bg-brand-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-brand-100" />
        </div>
        <span className="sr-only">Loading…</span>
      </main>
      <Footer />
    </>
  );
}
