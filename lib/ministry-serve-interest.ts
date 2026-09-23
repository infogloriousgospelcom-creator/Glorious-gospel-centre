export const SERVE_INTEREST_STATUSES = [
  "NEW",
  "CONTACTED",
  "ACCEPTED",
  "DECLINED",
  "CLOSED",
] as const;

export type ServeInterestStatus = (typeof SERVE_INTEREST_STATUSES)[number];

export const SERVE_INTEREST_OPEN_STATUSES: readonly ServeInterestStatus[] = [
  "NEW",
  "CONTACTED",
  "ACCEPTED",
];

export function isServeInterestStatus(value: string): value is ServeInterestStatus {
  return (SERVE_INTEREST_STATUSES as readonly string[]).includes(value);
}

export function isOpenServeInterestStatus(status: string): boolean {
  return (SERVE_INTEREST_OPEN_STATUSES as readonly string[]).includes(status);
}

/** Member-facing pastoral labels — never expose staff notes. */
export function serveInterestStatusLabel(status: string): string {
  switch (status) {
    case "NEW":
      return "Received";
    case "CONTACTED":
      return "We are in touch";
    case "ACCEPTED":
      return "Accepted";
    case "DECLINED":
      return "Not moving forward";
    case "CLOSED":
      return "Closed";
    default:
      return "Update";
  }
}

export function serveInterestStatusExplanation(status: string): string {
  switch (status) {
    case "NEW":
      return "The church has received your interest and will be in touch.";
    case "CONTACTED":
      return "A church leader is following up with you.";
    case "ACCEPTED":
      return "You are welcome to serve in this area. The church will share next steps.";
    case "DECLINED":
      return "This interest is not moving forward at this time. You are still welcome at GGCC.";
    case "CLOSED":
      return "This interest has been closed.";
    default:
      return "";
  }
}

export type OwnServeInterest = {
  id: string;
  ministry_id: string | null;
  ministry_name: string | null;
  status: ServeInterestStatus;
  member_note: string | null;
  created_at: string;
};

export type ServeInterestOption = {
  id: string;
  name: string;
  slug: string;
};
