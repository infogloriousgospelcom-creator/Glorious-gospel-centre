import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MemberForgotPasswordForm } from "./_components/MemberForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Glorious Gospel Centre Church account password.",
  robots: { index: false, follow: false },
};

export default function MemberForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Your account</p>
                <CardTitle className="mt-2">Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email and we will send a reset link if an account
                  exists.
                </CardDescription>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <MemberForgotPasswordForm />
                <p className="text-sm text-ink-muted">
                  Remembered it?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Back to sign in
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
