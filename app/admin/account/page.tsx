import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { requireAdmin } from "@/services/auth";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Account",
  description: "Manage your administrator account.",
  robots: { index: false, follow: false },
};

export default async function AdminAccountPage({
  searchParams,
}: {
  searchParams: { password?: string };
}) {
  const session = await requireAdmin();
  return (
    <Section>
      <Container>
        <div className="mb-8">
          <h1 className="heading-1 mb-2">Account</h1>
          <p className="text-sm text-ink-muted">Signed in as {session.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {session.roleKeys.map((r) => (
              <Badge key={r} tone="brand">
                {r}
              </Badge>
            ))}
            {session.permissionKeys.length > 0 ? (
              <Badge tone="accent">
                {session.permissionKeys.length} permission
                {session.permissionKeys.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Update the password used to sign in to the admin panel.
              </CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              {searchParams.password === "updated" ? (
                <div className="mb-4">
                  <Alert tone="success" title="Password updated">
                    You can now use your new password next time you sign in.
                  </Alert>
                </div>
              ) : null}
              <ChangePasswordForm />
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Email address</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-muted">
                Your sign-in email is shown above. Email changes will be added in
                a later phase.
              </p>
            </CardBody>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
