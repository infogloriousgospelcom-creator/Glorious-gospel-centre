/**
 * Pure helpers for the Congregant Account Hub (I-B6).
 * No I/O — unit-testable next-step and completeness logic.
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

function softChurchLinks(): AccountNextStepAction[] {
  return [
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
 */
export function selectAccountNextSteps(input: {
  emailConfirmed: boolean;
  memberships: AccountMembershipSnapshot[];
}): AccountNextStepsResult {
  const { emailConfirmed, memberships } = input;

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
      secondary: softChurchLinks(),
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
        ...softChurchLinks(),
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
      secondary: softChurchLinks(),
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
        ...softChurchLinks(),
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
      secondary: softChurchLinks(),
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
    secondary: softChurchLinks(),
  };
}
