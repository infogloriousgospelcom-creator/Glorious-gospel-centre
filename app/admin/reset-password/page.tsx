import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ChangePasswordForm } from "../account/_components/ChangePasswordForm";
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
      <Navbar />
      <main id="main" className="bg-surface-muted min-h-[calc(100vh-8rem)]">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>
                  Enter and confirm your new password to regain access.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <ChangePasswordForm />
                <p className="text-sm text-ink-muted">
                  Changed your mind?{" "}
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
