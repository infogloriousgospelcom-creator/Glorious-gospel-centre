import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ChangePasswordForm } from "../(protected)/account/_components/ChangePasswordForm";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set new password",
  description: "Choose a new password for your admin account.",
  robots: { index: false, follow: false },
};

/**
 * The user reaches this page after clicking the recovery link in their
 * email. Supabase Auth sets a temporary session whose only purpose is to
 * let the user call `updateUser({ password })`. After the update, the
 * server action redirects to /admin/account.
 */
export default async function ResetPasswordPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/admin/login");
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Administrator</p>
                <CardTitle className="mt-2">Set a new password</CardTitle>
                <CardDescription>
                  Enter and confirm your new password to regain access.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <ChangePasswordForm />
                <p className="text-sm text-ink-muted">
                  Changed your mind?{" "}
                  <Link href="/admin/login" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
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