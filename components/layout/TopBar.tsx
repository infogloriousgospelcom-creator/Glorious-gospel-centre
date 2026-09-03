import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function TopBar() {
  return (
    <div className="border-b border-brand-100 bg-brand-900 text-brand-50">
      <Container className="flex h-9 items-center justify-between text-xs">
        <p className="hidden sm:block">Welcome to Glorious Gospel Centre</p>
        <div className="flex items-center gap-4">
          <a href="tel:+0000000000" className="hover:text-white">
            <span aria-hidden="true">[Phone TBD]</span>
          </a>
          <Link href="/contact" className="hover:text-white">
            Visit us
          </Link>
        </div>
      </Container>
    </div>
  );
}
