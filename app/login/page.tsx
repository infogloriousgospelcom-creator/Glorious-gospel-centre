import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getCurrentAdmin, getCurrentUser } from "@/services/auth";
import { safeMemberRedirect } from "@/lib/auth-redirects";
import { MemberLoginForm } from "./_components/MemberLoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Glorious Gospel Centre Church account.",
  robots: { index: false, follow: false },
};

export default async function MemberLoginPage({
  searchParams,
}: {
  searchParams: { redirect_to?: string; error?: string; next?: string };
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/dashboard");

  const user = await getCurrentUser();
  if (user) redirect("/account");

  const redirectTo =
    safeMemberRedirect(searchParams.redirect_to) ??
    safeMemberRedirect(searchParams.next) ??
    undefined;

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Your account</p>
                <CardTitle className="mt-2">Sign in</CardTitle>
                <CardDescription>
                  Sign in to manage your church account. Connect Group membership
                  will arrive in a later update.
                </CardDescription>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <MemberLoginForm
                  redirectTo={redirectTo}
                  authError={searchParams.error ? searchParams.error : null}
                />
                <p className="text-sm text-ink-muted">
                  New here?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Create an account
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
