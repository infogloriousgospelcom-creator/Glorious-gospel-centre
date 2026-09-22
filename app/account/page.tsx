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
import {
  computeProfileCompleteness,
  selectAccountNextSteps,
} from "@/lib/account-hub";
import { MemberProfileForm } from "./_components/MemberProfileForm";
import { AccountMembershipSections } from "./_components/AccountMembershipSections";
import { AccountSecuritySection } from "./_components/AccountSecuritySection";
import { AccountNextStepsPanel } from "./_components/AccountNextStepsPanel";
import { ProfileCompletenessIndicator } from "./_components/ProfileCompletenessIndicator";

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
  const completeness = computeProfileCompleteness({
    fullName: session.fullName,
    phone: session.phone,
    emailConfirmed: session.emailConfirmed,
  });
  const nextSteps = selectAccountNextSteps({
    emailConfirmed: session.emailConfirmed,
    memberships: memberships.map((m) => ({
      status: m.status,
      group_name: m.group_name,
      group_slug: m.group_slug,
      group_status: m.group_status,
    })),
  });

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Section className="bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
          <Container width="prose">
            <p className="eyebrow mb-2">Your account</p>
            <h1 className="heading-1 mb-3">
              Welcome{session.fullName ? `, ${session.fullName}` : ""}
            </h1>
            <p className="lead mb-6 max-w-2xl">
              Manage your profile, account security, and Connect Group membership from one place.
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
                <div className="space-y-6 px-6 pb-6">
                  <ProfileCompletenessIndicator completeness={completeness} />
                  <p className="text-sm text-ink-muted">
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
                  <CardTitle>Account security</CardTitle>
                  <CardDescription>
                    Email verification and password for your church account.
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <AccountSecuritySection
                    email={session.email}
                    emailConfirmed={session.emailConfirmed}
                  />
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Connect Groups</CardTitle>
                  <CardDescription>
                    Your membership requests and active groups (your records only).
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <AccountMembershipSections memberships={memberships} />
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Your next steps</CardTitle>
                  <CardDescription>
                    Simple suggestions based on your current account and membership status.
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <AccountNextStepsPanel steps={nextSteps} />
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
