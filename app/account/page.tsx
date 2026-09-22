import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/services/auth";
import { memberSignOutAction } from "@/services/auth.actions";
import { listOwnMembershipsWithGroups } from "@/services/connect-group-membership";
import { MemberProfileForm } from "./_components/MemberProfileForm";
import { AccountMembershipSections } from "./_components/AccountMembershipSections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your Glorious Gospel Centre Church account.",
  robots: { index: false, follow: false },
};

export default async function MemberAccountPage({
  searchParams,
}: {
  searchParams: { password?: string };
}) {
  const session = await requireUser("/login");
  const memberships = await listOwnMembershipsWithGroups();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
          <Container width="prose">
            <p className="eyebrow mb-2">Your account</p>
            <h1 className="heading-1 mb-3">Welcome{session.fullName ? `, ${session.fullName}` : ""}</h1>
            <p className="lead mb-6 max-w-2xl">
              Manage your profile and see your Connect Group membership requests.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={session.emailConfirmed ? "success" : "warning"}>
                {session.emailConfirmed ? "Email confirmed" : "Email not confirmed"}
              </Badge>
              <form action={memberSignOutAction}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </Container>
        </Section>

        <Section>
          <Container>
            {searchParams.password === "updated" ? (
              <div className="mb-6">
                <Alert tone="success" title="Password updated">
                  You can use your new password the next time you sign in.
                </Alert>
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Update the name and phone number on your account.
                  </CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                  <p className="mb-4 text-sm text-ink-muted">
                    Signed in as <span className="font-medium text-ink">{session.email}</span>
                  </p>
                  <MemberProfileForm
                    fullName={session.fullName ?? ""}
                    phone={session.phone ?? ""}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connect Groups</CardTitle>
                  <CardDescription>
                    Your membership requests and active groups (your records only).
                  </CardDescription>
                </CardHeader>
                <CardBody className="space-y-4">
                  <AccountMembershipSections memberships={memberships} />
                </CardBody>
              </Card>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
