import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-page py-section text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="heading-1 mb-4">Page not found</h1>
        <p className="lead mx-auto mb-8 max-w-xl">
          We couldn&apos;t find that page. It may have moved — try returning home
          or use the menu to continue.
        </p>
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </main>
      <Footer />
    </>
  );
}