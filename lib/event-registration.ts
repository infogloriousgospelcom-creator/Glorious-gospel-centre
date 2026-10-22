/**
 * Server-authoritative event registration eligibility.
 * Capacity is intentionally not decided here (see Phase M: race-safe
 * capacity needs a lock/RPC and is deferred).
 */

export type EventRegistrationEligibility = {
  status: string;
  registration_required: boolean;
  starts_at: string;
  ends_at: string | null;
};

export function eventHasEnded(event: {
  starts_at: string;
  ends_at: string | null;
}, now: Date = new Date()): boolean {
  const endIso = event.ends_at ?? event.starts_at;
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return true;
  return end.getTime() < now.getTime();
}

/** Safe member-facing reason, or null when registration may proceed. */
export function eventRegistrationBlockReason(
  event: EventRegistrationEligibility | null,
  now: Date = new Date(),
): string | null {
  if (!event) return "That event could not be found.";
  if (event.status !== "PUBLISHED") {
    return "This event is not open for registration.";
  }
  if (!event.registration_required) {
    return "Registration is not enabled for this event.";
  }
  if (eventHasEnded(event, now)) {
    return "Registration for this event has closed.";
  }
  return null;
}
