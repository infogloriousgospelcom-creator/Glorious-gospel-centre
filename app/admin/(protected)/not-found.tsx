import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="heading-2 mb-4">Not found</h1>
      <p className="lead mx-auto mb-8 max-w-md">
        That admin page isn&apos;t available. Return to the dashboard to continue.
      </p>
      <div className="flex gap-3">
        <Link href="/admin/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Back to Site</Button>
        </Link>
      </div>
    </div>
  );
}
