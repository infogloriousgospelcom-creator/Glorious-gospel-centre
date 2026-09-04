import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/Container";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { AdminSubnav } from "@/components/layout/AdminSubnav";
import { requireAdmin } from "@/services/auth";
import { getEventForAdmin, listEventRegistrations } from "@/services/admin/events.read";
import { deleteEvent } from "@/services/admin/events";
import { EventForm } from "../_components/EventForm";
import { ApprovalHistoryPanel } from "@/components/admin/ApprovalHistoryPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: _params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return { title: "Edit event · Admin", robots: { index: false, follow: false } };
}

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const row = await getEventForAdmin(params.id);
  if (!row) notFound();
  const registrations = await listEventRegistrations(params.id);
  const id = params.id;

  async function deleteAction() {
    "use server";
    const res = await deleteEvent(id);
    if (!res.ok) throw new Error(res.message);
  }

  return (
    <>
      <AdminSubnav active="/admin/events" />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            <Link
              href="/admin/events"
              className="inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← All events
            </Link>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Edit event</CardTitle>
                  <Badge>{row.status}</Badge>
                  {row.registration_required ? <Badge tone="accent">Registration</Badge> : null}
                </div>
              </CardHeader>
              <div className="px-6 pb-6">
                <EventForm
                  initial={{
                    id: row.id,
                    slug: row.slug,
                    title: row.title,
                    short_description: row.short_description,
                    description: row.description,
                    poster_url: row.poster_url,
                    starts_at: row.starts_at,
                    ends_at: row.ends_at,
                    location: row.location,
                    speaker: row.speaker,
                    registration_required: row.registration_required,
                    status: row.status,
                  }}
                />
                <div className="mt-8 border-t border-brand-100 pt-6">
                  <form action={deleteAction}>
                    <Alert tone="warning" title="Danger zone">
                      Deleting an event also removes its registrations.
                    </Alert>
                    <div className="mt-3 flex justify-end">
                      <Button type="submit" variant="danger">
                        Delete event
                      </Button>
                    </div>
                  </form>
                </div>
                <ApprovalHistoryPanel entityType="events" entityId={row.id} />
              </div>
            </Card>

            {row.registration_required ? (
              <Card>
                <CardHeader>
                  <CardTitle>Registrations ({registrations.length})</CardTitle>
                </CardHeader>
                <div className="px-6 pb-6">
                  {registrations.length === 0 ? (
                    <p className="text-sm text-ink-muted">No registrations yet.</p>
                  ) : (
                    <ul className="divide-y divide-brand-100">
                      {registrations.map((r) => (
                        <li key={r.id} className="py-3 text-sm">
                          <p className="font-medium text-ink">{r.full_name}</p>
                          <p className="text-xs text-ink-muted">
                            {r.email ?? "—"} · {r.phone ?? "—"} · {new Date(r.created_at).toLocaleString()}
                          </p>
                          {r.notes ? (
                            <p className="mt-1 text-xs text-ink-muted">{r.notes}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}
