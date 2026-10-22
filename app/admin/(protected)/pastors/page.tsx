import type { Metadata } from "next";
import { requireAdmin } from "@/services/auth";
import { listAllLeaders } from "@/services/admin/leaders.read";
import { LeaderAdminList } from "@/components/admin/LeaderAdminList";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pastors · Admin", robots: { index: false, follow: false } };

export default async function AdminPastorsPage() {
  await requireAdmin();
  const rows = await listAllLeaders("PASTOR");
  return (
    <LeaderAdminList
      rows={rows}
      basePath="/admin/pastors"
      title="Pastors"
      newLabel="New pastor"
      emptyTitle="No pastors yet"
      emptyDescription="Click 'New pastor' to add the first one."
    />
  );
}
