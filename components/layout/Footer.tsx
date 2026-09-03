import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-50">
      <div className="container-page py-10 text-sm text-brand-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-base text-brand-900">
            Glorious Gospel Centre
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <li>
                <Link href="/about" className="hover:text-brand-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/sermons" className="hover:text-brand-900">
                  Sermons
                </Link>
              </li>
              <li>
                <Link href="/give" className="hover:text-brand-900">
                  Give
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-brand-900">
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-6 text-xs text-brand-600">
          © {new Date().getFullYear()} Glorious Gospel Centre. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
