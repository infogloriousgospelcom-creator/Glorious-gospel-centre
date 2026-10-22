/**
 * Pure helpers for the Congregant Account Hub (I-B6).
 * No I/O — unit-testable next-step, completeness and dashboard-stat logic.
 */

export type AccountMembershipSnapshot = {
  status: string;
  group_name: string | null;
  group_slug: string | null;
  group_status: string | null;
};

export type AccountNextStepAction = {
  href: string;
  label: string;
  description?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export type AccountNextStepsResult = {
  title: string;
  description: string;
  primary: AccountNextStepAction;
  secondary: AccountNextStepAction[];
};

export type ProfileCompleteness = {
  /** 0–3 completed items */
  completed: number;
  total: number;
  hasName: boolean;
  hasPhone: boolean;
  emailConfirmed: boolean;
};

export function computeProfileCompleteness(input: {
  fullName: string | null | undefined;
  phone: string | null | undefined;
  emailConfirmed: boolean;
}): ProfileCompleteness {
  const hasName = Boolean(input.fullName?.trim());
  const hasPhone = Boolean(input.phone?.trim());
  const emailConfirmed = Boolean(input.emailConfirmed);
  const completed = [hasName, hasPhone, emailConfirmed].filter(Boolean).length;
  return { completed, total: 3, hasName, hasPhone, emailConfirmed };
}

function softChurchLinks(hasActiveAnnouncements = false): AccountNextStepAction[] {
  const links: AccountNextStepAction[] = [
    {
      href: "/visit",
      label: "Plan Your Visit",
      description: "Service times and what to expect.",
      variant: "secondary",
    },
    {
      href: "/prayer",
      label: "Prayer",
      description: "Share a prayer request with the church.",
      variant: "secondary",
    },
    {
      href: "/give",
      label: "Give",
      description: "Support the mission of GGCC.",
      variant: "secondary",
    },
  ];
  if (hasActiveAnnouncements) {
    links.unshift({
      href: "#church-notices",
      label: "Church Notices",
      description: "Read current church announcements.",
      variant: "secondary",
    });
  }
  return links;
}

function firstJoinableTerminal(
  memberships: AccountMembershipSnapshot[],
): AccountMembershipSnapshot | null {
  return (
    memberships.find(
      (m) =>
        (m.status === "DECLINED" || m.status === "LEFT" || m.status === "REMOVED") &&
        m.group_status === "OPEN" &&
        Boolean(m.group_slug),
    ) ?? null
  );
}

/**
 * Deterministic account next-step selector.
 * Priority: unverified → PENDING → ACTIVE → joinable terminal → browse Connect Groups.
 * Active church notices only add a secondary discovery link (never override primary).
 */
export function selectAccountNextSteps(input: {
  emailConfirmed: boolean;
  memberships: AccountMembershipSnapshot[];
  /** When true, adds a secondary link to #church-notices (I-B9). */
  hasActiveAnnouncements?: boolean;
}): AccountNextStepsResult {
  const { emailConfirmed, memberships, hasActiveAnnouncements = false } = input;
  const soft = () => softChurchLinks(hasActiveAnnouncements);

  if (!emailConfirmed) {
    return {
      title: "Verify your email",
      description:
        "Confirm your email address to unlock Connect Group membership and keep your account secure.",
      primary: {
        href: "#account-security",
        label: "Go to account security",
        description: "Resend the verification email if you need a new link.",
        variant: "primary",
      },
      secondary: soft(),
    };
  }

  const pending = memberships.filter((m) => m.status === "PENDING");
  const active = memberships.filter((m) => m.status === "ACTIVE");
  const joinableTerminal = firstJoinableTerminal(memberships);
  const hasAnyMembership = memberships.length > 0;

  if (pending.length > 0) {
    const first = pending[0]!;
    const groupHref = first.group_slug ? `/connect/${first.group_slug}` : "/account";
    return {
      title: "Your Connect Group request is awaiting review",
      description:
        "Church leaders will respond to your request. You do not need to submit another request for the same group.",
      primary: {
        href: groupHref,
        label: first.group_name
          ? `View ${first.group_name}`
          : "View your request",
        variant: "primary",
      },
      secondary: [
        { href: "/connect", label: "Browse Connect Groups", variant: "secondary" },
        ...soft(),
      ],
    };
  }

  if (active.length > 0) {
    const first = active[0]!;
    const groupHref = first.group_slug ? `/connect/${first.group_slug}` : "/connect";
    return {
      title: "Stay connected with your group",
      description: "Open your Connect Group page for details, or explore other ways to engage at GGCC.",
      primary: {
        href: groupHref,
        label: first.group_name ? `Open ${first.group_name}` : "Open your Connect Group",
        variant: "primary",
      },
      secondary: soft(),
    };
  }

  if (joinableTerminal) {
    return {
      title: "You can request to join again",
      description:
        "A previous membership for this group ended. If the group is open, you may submit a new request for review.",
      primary: {
        href: `/connect/${joinableTerminal.group_slug}`,
        label: joinableTerminal.group_name
          ? `Request to join ${joinableTerminal.group_name}`
          : "Request to join again",
        variant: "primary",
      },
      secondary: [
        { href: "/connect", label: "Find another Connect Group", variant: "secondary" },
        ...soft(),
      ],
    };
  }

  if (hasAnyMembership) {
    return {
      title: "Find a Connect Group",
      description:
        "Your previous group is not currently accepting new requests. Browse other open Connect Groups.",
      primary: {
        href: "/connect",
        label: "Browse Connect Groups",
        variant: "primary",
      },
      secondary: soft(),
    };
  }

  return {
    title: "Find a Connect Group",
    description:
      "Connect Groups are a great next step after creating your account. Requests are reviewed by the church.",
    primary: {
      href: "/connect",
      label: "Find a Connect Group",
      variant: "primary",
    },
    secondary: soft(),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard stat cards                                                */
/* ------------------------------------------------------------------ */

/**
 * Minimal structural snapshots for the dashboard stat cards.
 *
 * These shapes are declared here rather than imported from the services on
 * purpose: `services/member-giving.ts` and `lib/member-notifications.ts`
 * are `server-only`, and this module must stay importable from anywhere.
 * The page maps its fetched rows into these shapes at the call site, exactly
 * as it already does for `AccountMembershipSnapshot`.
 *
 * Only fields the member can already see on their own dashboard are included.
 */
export type AccountGivingSnapshot = {
  amount_cents: number;
  currency: string;
  status: string;
};

export type AccountStatsInput = {
  giving: { ok: boolean; items: AccountGivingSnapshot[] };
  /**
   * Connect Group memberships. Note there is no `ok` flag — the service
   * returns a bare array — so a load failure reads as zero. This matches
   * what the Connect Groups card on the page already shows.
   */
  memberships: { status: string }[];
  notifications: { ok: boolean; items: { read_at: string | null }[] };
  serveInterests: { ok: boolean; items: { status: string }[] };
};

export type AccountStats = {
  giving: {
    /** False when the giving history could not be loaded. */
    ok: boolean;
    /** Sum of successful gifts, in the display currency. */
    totalCents: number;
    currency: string;
    /** Number of successful gifts counted in `totalCents`. */
    gifts: number;
    /** Gifts still pending or processing. */
    pending: number;
  };
  groups: {
    active: number;
    pending: number;
  };
  updates: {
    ok: boolean;
    unread: number;
    total: number;
  };
  serving: {
    ok: boolean;
    total: number;
    accepted: number;
  };
};

/**
 * Derives the dashboard stat cards from data the page has already fetched.
 *
 * Never invents a number: when a source reports `ok: false` the caller must
 * render an unavailable state rather than a zero. Amounts are only summed
 * within a single currency — gifts in different currencies are never added
 * together.
 */
export function computeAccountStats(input: AccountStatsInput): AccountStats {
  const givingInput = input.giving ?? { ok: false, items: [] };
  const givingItems = givingInput.items ?? [];
  const successful = givingItems.filter((item) => item.status === "SUCCESS");
  const currency = successful[0]?.currency ?? givingItems[0]?.currency ?? "KES";
  // Only sum gifts in the display currency — never add across currencies.
  const sameCurrency = successful.filter((item) => item.currency === currency);
  const totalCents = sameCurrency.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount_cents) ? item.amount_cents : 0),
    0,
  );

  const memberships = input.memberships ?? [];
  const notificationInput = input.notifications ?? { ok: false, items: [] };
  const notificationItems = notificationInput.items ?? [];
  const serveInput = input.serveInterests ?? { ok: false, items: [] };
  const serveItems = serveInput.items ?? [];

  return {
    giving: {
      ok: Boolean(givingInput.ok),
      totalCents,
      currency,
      gifts: sameCurrency.length,
      pending: givingItems.filter(
        (item) => item.status === "PENDING" || item.status === "PROCESSING",
      ).length,
    },
    groups: {
      active: memberships.filter((m) => m.status === "ACTIVE").length,
      pending: memberships.filter((m) => m.status === "PENDING").length,
    },
    updates: {
      ok: Boolean(notificationInput.ok),
      unread: notificationItems.filter((n) => !n.read_at).length,
      total: notificationItems.length,
    },
    serving: {
      ok: Boolean(serveInput.ok),
      total: serveItems.length,
      accepted: serveItems.filter((s) => s.status === "ACCEPTED").length,
    },
  };
}
