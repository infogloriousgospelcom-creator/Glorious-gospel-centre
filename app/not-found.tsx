import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-page py-24 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-brand-600">
          404
        </p>
        <h1 className="heading-1 mb-4">Page not found</h1>
        <p className="lead mx-auto mb-8 max-w-xl">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-medium text-white hover:bg-brand-800"
        >
          Return home
        </Link>
      </main>
      <Footer />
    </>
  );
}
