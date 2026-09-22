/**
 * Connect Groups helpers — Phase I-A (public discovery).
 */

export type ConnectGroupStatus = "DRAFT" | "OPEN" | "FULL" | "CLOSED" | "ARCHIVED";

/** Statuses visible on the public site. */
export const PUBLIC_CONNECT_GROUP_STATUSES: ConnectGroupStatus[] = [
  "OPEN",
  "FULL",
  "CLOSED",
];

export function isPublicConnectGroupStatus(
  status: string,
): status is "OPEN" | "FULL" | "CLOSED" {
  return PUBLIC_CONNECT_GROUP_STATUSES.includes(status as ConnectGroupStatus);
}

export function slugifyConnectGroupName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "connect-group";
}

export function uniqueConnectGroupSlug(name: string, id: string): string {
  const base = slugifyConnectGroupName(name);
  const suffix = id.replace(/-/g, "").slice(0, 8);
  return `${base}-${suffix}`;
}

export function connectGroupAvailabilityLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Open to connect";
    case "FULL":
      return "Currently full";
    case "CLOSED":
      return "Not accepting new members";
    default:
      return status;
  }
}

export function toPlainConnectText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim();
}
