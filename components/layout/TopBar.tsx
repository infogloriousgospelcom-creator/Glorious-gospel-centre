import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function TopBar() {
  return (
    <div className="border-b border-brand-100 bg-brand-900 text-brand-50">
      <Container className="flex h-9 items-center justify-between text-xs">
        <p className="hidden sm:block">Welcome to Glorious Gospel Centre</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" role="presentation">📞</span>
            <span className="sr-only">Phone</span>
            <span aria-label="Phone number to be provided">[Phone TBD]</span>
          </span>
          <Link href="/contact" className="hover:text-white">
            Visit us
          </Link>
        </div>
      </Container>
    </div>
  );
}
