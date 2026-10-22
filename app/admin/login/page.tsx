import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getCurrentAdmin } from "@/services/auth";
import { LoginForm } from "./_components/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign-in",
  description: "Administrator sign-in.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect_to?: string };
}) {
  const session = await getCurrentAdmin();
  if (session) redirect("/admin/dashboard");

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Administrator</p>
                <CardTitle className="mt-2">Sign in</CardTitle>
                <CardDescription>
                  Administrator access. Use the email and password provided by
                  your church administrator.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6">
                <LoginForm redirectTo={searchParams.redirect_to} />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}