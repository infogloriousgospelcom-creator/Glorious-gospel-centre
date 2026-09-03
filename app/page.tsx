import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Glorious Gospel Centre Church.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main" className="container-page py-16">
        <section className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-brand-600">
            Glorious Gospel Centre
          </p>
          <h1 className="heading-1 mb-6">A community anchored in grace.</h1>
          <p className="lead mb-8">
            Welcome to our church family. We are a worshiping community committed
            to the Word, prayer, and reaching our city with the Gospel of Jesus
            Christ.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
            >
              Learn more
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 px-5 py-3 text-sm font-medium text-brand-800 transition hover:bg-brand-50"
            >
              Visit us
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
