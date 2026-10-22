import type { Metadata } from "next";
import { requireAdmin } from "@/services/auth";
import { listAllLeaders } from "@/services/admin/leaders.read";
import { LeaderAdminList } from "@/components/admin/LeaderAdminList";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Leadership · Admin", robots: { index: false, follow: false } };

export default async function AdminLeadershipPage() {
  await requireAdmin();
  const rows = await listAllLeaders();
  return (
    <LeaderAdminList
      rows={rows}
      basePath="/admin/leadership"
      title="Leadership"
      newLabel="New leader"
      emptyTitle="No leaders yet"
      emptyDescription="Click 'New leader' to add the first one."
      showCategory
    />
  );
}
