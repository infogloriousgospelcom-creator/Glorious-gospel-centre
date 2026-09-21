export default function Loading() {
  return (
    <main className="container-page py-section" aria-busy="true" aria-live="polite">
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-brand-100" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-full animate-pulse rounded bg-brand-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-brand-100" />
      </div>
      <span className="sr-only">Loading content, please wait…</span>
    </main>
  );
}