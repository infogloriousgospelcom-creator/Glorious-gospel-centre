import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { requirePermission } from "@/services/auth";
import { getAllPublishedMinistries } from "@/services/content";
import { getConnectGroupForAdmin } from "@/services/admin/connect-groups.read";
import { ConnectGroupForm } from "../_components/ConnectGroupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Edit Connect Group · Admin",
  robots: { index: false, follow: false },
};

export default async function EditConnectGroupPage({
  params,
}: {
  params: { id: string };
}) {
  await requirePermission("connect_groups.manage");
  const [row, ministries] = await Promise.all([
    getConnectGroupForAdmin(params.id),
    getAllPublishedMinistries(),
  ]);
  if (!row) notFound();

  return (
    <Section>
      <Container width="content">
        <h1 className="heading-1 mb-6">Edit Connect Group</h1>
        <ConnectGroupForm
          initial={row}
          ministries={ministries.map((m) => ({ id: m.id, name: m.name }))}
        />
        <p className="mt-6 text-sm text-ink-muted">
          <a
            href={`/admin/connect-groups/${row.id}/members`}
            className="font-semibold text-brand-700 hover:underline"
          >
            Moderate memberships →
          </a>
        </p>
      </Container>
    </Section>
  );
}
