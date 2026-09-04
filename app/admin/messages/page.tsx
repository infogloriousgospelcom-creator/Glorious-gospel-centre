import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { listAllMessages } from "@/services/admin/messages.read";
import { MessageRow } from "./_components/MessageRow";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages · Admin", robots: { index: false, follow: false } };
export default async function AdminMessagesPage() {
  await requireAdmin();
  const rows = await listAllMessages();
  return (
    <>
      <AdminSubnav active="/admin/messages" />
      <Section>
        <Container>
          <div className="mb-6">
            <h1 className="heading-1">Contact messages</h1>
            <p className="text-sm text-ink-muted">{rows.length} total. Newest first.</p>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="No messages yet" description="Submissions from the contact form will appear here." />
          ) : (
            <Card>
              <ul className="divide-y divide-brand-100">
                {rows.map((m) => <MessageRow key={m.id} msg={m} />)}
              </ul>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
