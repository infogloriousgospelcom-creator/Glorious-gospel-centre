import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getCurrentUser } from "@/services/auth";
import { RegisterForm } from "./_components/RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Glorious Gospel Centre Church account.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface-muted">
        <div className="container-page py-section">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <p className="eyebrow">Join the church family online</p>
                <CardTitle className="mt-2">Create an account</CardTitle>
                <CardDescription>
                  Register with your email. You will confirm your address before
                  using your account.
                </CardDescription>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <RegisterForm />
                <p className="text-sm text-ink-muted">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Sign in
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
