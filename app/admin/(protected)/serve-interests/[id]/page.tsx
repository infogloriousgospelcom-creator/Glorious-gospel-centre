import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { requirePermission } from "@/services/auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIpHash } from "@/lib/ip-hash";
import { getServeInterestForAdmin } from "@/services/admin/serve-interests.read";
import { ServeInterestUpdateForm } from "../_components/ServeInterestUpdateForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Serve interest · Admin", robots: { index: false, follow: false } };
}

export default async function AdminServeInterestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requirePermission("serve_interests.manage");
  const row = await getServeInterestForAdmin(params.id);
  if (!row) notFound();

  await writeAuditLog({
    actorId: session.userId,
    action: "serve_interest.read",
    entityType: "ministry_serve_interest",
    entityId: row.id,
    metadata: { status: row.status, ministry_id: row.ministry_id },
    ipHash: getClientIpHash(),
  });

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href="/admin/serve-interests"
            className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            ← All serve interests
          </Link>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{row.member_full_name?.trim() || "Member"}</CardTitle>
                <Badge tone={row.status === "NEW" ? "warning" : "neutral"}>{row.status}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-muted">Ministry</dt>
                  <dd className="font-medium text-ink">{row.ministry_name ?? "General serving"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Submitted</dt>
                  <dd className="text-ink">{new Date(row.created_at).toLocaleString()}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-ink-muted">Member note</dt>
                  <dd className="text-ink">{row.member_note?.trim() || "—"}</dd>
                </div>
                {row.reviewed_at ? (
                  <div>
                    <dt className="text-ink-muted">Last reviewed</dt>
                    <dd className="text-ink">{new Date(row.reviewed_at).toLocaleString()}</dd>
                  </div>
                ) : null}
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Update</CardTitle>
            </CardHeader>
            <CardBody>
              <ServeInterestUpdateForm
                interestId={row.id}
                status={row.status}
                staffNote={row.staff_note}
              />
            </CardBody>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
