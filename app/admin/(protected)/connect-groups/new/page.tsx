import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/Container";
import { requirePermission } from "@/services/auth";
import { getAllPublishedMinistries } from "@/services/content";
import { ConnectGroupForm } from "../_components/ConnectGroupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "New Connect Group · Admin",
  robots: { index: false, follow: false },
};

export default async function NewConnectGroupPage() {
  await requirePermission("connect_groups.manage");
  const ministries = await getAllPublishedMinistries();

  return (
    <Section>
      <Container width="content">
        <h1 className="heading-1 mb-6">New Connect Group</h1>
        <ConnectGroupForm
          ministries={ministries.map((m) => ({ id: m.id, name: m.name }))}
        />
      </Container>
    </Section>
  );
}
