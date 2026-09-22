import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { createClient } from "@/supabase/server";
import { MemberChangePasswordForm } from "./_components/MemberChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your church account.",
  robots: { index: false, follow: false },
};

/**
 * Reached after the recovery email → /auth/callback?next=/reset-password.
 * Requires an authenticated recovery (or active) session.
 */
export default async function MemberResetPasswordPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login?error=auth");
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Your account</p>
                <CardTitle className="mt-2">Set a new password</CardTitle>
                <CardDescription>
                  Enter and confirm your new password to regain access.
                </CardDescription>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <MemberChangePasswordForm />
                <p className="text-sm text-ink-muted">
                  Changed your mind?{" "}
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
