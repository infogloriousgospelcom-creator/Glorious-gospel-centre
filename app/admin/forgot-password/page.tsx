import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request an admin password reset link.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-surface-muted min-h-[calc(100vh-8rem)]">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email and we will send a reset link.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <ForgotPasswordForm />
                <p className="text-sm text-ink-muted">
                  Remembered it?{" "}
                  <Link href="/admin/login" className="font-medium text-brand-700 hover:text-brand-800">
                    Back to sign in
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
