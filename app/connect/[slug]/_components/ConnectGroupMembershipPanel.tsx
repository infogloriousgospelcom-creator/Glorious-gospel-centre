"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  leaveConnectGroupAction,
  rerequestConnectGroupMembershipAction,
  requestConnectGroupJoinAction,
  type MembershipActionState,
} from "@/services/connect-group-membership.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Form";
import { LinkButton } from "@/components/ui/LinkButton";
import type { ConnectGroupMembershipOwn } from "@/lib/connect-group-members";
import { membershipStatusLabel } from "@/lib/connect-group-members";

const initialState: MembershipActionState = { ok: false, message: "" };

function JoinSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Request to Join
    </Button>
  );
}

function LeaveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" isLoading={pending} className="w-full sm:w-auto">
      Leave Group
    </Button>
  );
}

function RerequestSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} className="w-full sm:w-auto">
      Request to Join Again
    </Button>
  );
}

export function ConnectGroupMembershipPanel({
  groupId,
  groupSlug,
  groupStatus,
  isAuthenticated,
  emailConfirmed,
  membership,
}: {
  groupId: string;
  groupSlug: string;
  groupStatus: "OPEN" | "FULL" | "CLOSED";
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  membership: ConnectGroupMembershipOwn | null;
}) {
  const loginHref = `/login?redirect_to=${encodeURIComponent(`/connect/${groupSlug}`)}`;

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-ink-muted">
          Sign in to request membership in this Connect Group. Membership requests are
          reviewed by the church — they are not approved automatically.
        </p>
        {groupStatus === "OPEN" ? (
          <LinkButton href={loginHref}>Join this group</LinkButton>
        ) : groupStatus === "FULL" ? (
          <p className="text-sm font-medium text-ink">This group is currently full.</p>
        ) : (
          <p className="text-sm font-medium text-ink">
            This group is not accepting new membership requests.
          </p>
        )}
        <LinkButton href="/contact" variant="secondary">
          Contact GGCC
        </LinkButton>
      </div>
    );
  }

  if (!emailConfirmed) {
    return (
      <div className="space-y-3">
        <Alert tone="warning" title="Verify your email">
          Please verify your email address before joining a Connect Group. Check your inbox
          for the confirmation link, then return here.
        </Alert>
        <LinkButton href="/account" variant="secondary">
          Go to my account
        </LinkButton>
      </div>
    );
  }

  if (membership?.status === "PENDING") {
    return (
      <div className="space-y-3">
        <Alert tone="success" title="Request pending">
          Your request to join is awaiting review. You will remain pending until the church
          responds. Online withdrawal of pending requests is not available yet — contact GGCC
          if you need to cancel.
        </Alert>
        {membership.requested_at ? (
          <p className="text-xs text-ink-muted">
            Requested {new Date(membership.requested_at).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    );
  }

  if (membership?.status === "ACTIVE") {
    return <LeaveMembershipForm membershipId={membership.id} />;
  }

  if (
    membership?.status === "DECLINED" ||
    membership?.status === "LEFT" ||
    membership?.status === "REMOVED"
  ) {
    if (groupStatus === "OPEN") {
      return (
        <RerequestMembershipForm
          membershipId={membership.id}
          priorStatus={membership.status}
        />
      );
    }
    return (
      <div className="space-y-3">
        <Alert tone="info" title={membershipStatusLabel(membership.status)}>
          {membership.status === "DECLINED"
            ? "A previous request for this group was declined."
            : membership.status === "LEFT"
              ? "You previously left this group."
              : "Your membership in this group was ended."}{" "}
          {groupStatus === "FULL"
            ? "This group is currently full and is not accepting new requests."
            : "This group is not currently accepting new membership requests."}
        </Alert>
        <LinkButton href="/contact" variant="secondary">
          Contact GGCC
        </LinkButton>
      </div>
    );
  }

  if (groupStatus === "FULL") {
    return (
      <p className="text-sm font-medium text-ink">
        This Connect Group is currently full and is not accepting new requests.
      </p>
    );
  }

  if (groupStatus !== "OPEN") {
    return (
      <p className="text-sm font-medium text-ink">
        This Connect Group is not accepting new membership requests.
      </p>
    );
  }

  return <JoinMembershipForm groupId={groupId} />;
}

function JoinMembershipForm({ groupId }: { groupId: string }) {
  const [state, formAction] = useFormState(requestConnectGroupJoinAction, initialState);

  if (state.ok) {
    return (
      <Alert tone="success" title="Request pending">
        {state.message}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="connect_group_id" value={groupId} />
      <p className="text-sm leading-relaxed text-ink-muted">
        Submit a request to join. Church leaders will review it — approval is not automatic.
      </p>
      <Field
        label="Optional note"
        htmlFor="join-member-note"
        hint="Share anything helpful for the review (max 500 characters)."
        error={state.errors?.member_note}
      >
        <Textarea
          id="join-member-note"
          name="member_note"
          rows={3}
          maxLength={500}
          aria-invalid={Boolean(state.errors?.member_note)}
        />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <JoinSubmit />
    </form>
  );
}

function RerequestMembershipForm({
  membershipId,
  priorStatus,
}: {
  membershipId: string;
  priorStatus: "DECLINED" | "LEFT" | "REMOVED";
}) {
  const [state, formAction] = useFormState(rerequestConnectGroupMembershipAction, initialState);

  if (state.ok) {
    return (
      <Alert tone="success" title="Request pending">
        {state.message}
      </Alert>
    );
  }

  const intro =
    priorStatus === "DECLINED"
      ? "A previous request was declined. You may request to join again — the church will review it."
      : priorStatus === "LEFT"
        ? "You previously left this group. You may request to join again — the church will review it."
        : "Your membership was ended. You may request to join again — the church will review it.";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="membership_id" value={membershipId} />
      <Alert tone="info" title={membershipStatusLabel(priorStatus)}>
        {intro}
      </Alert>
      <Field
        label="Optional note"
        htmlFor="rerequest-member-note"
        hint="Share anything helpful for the review (max 500 characters)."
        error={state.errors?.member_note}
      >
        <Textarea
          id="rerequest-member-note"
          name="member_note"
          rows={3}
          maxLength={500}
          aria-invalid={Boolean(state.errors?.member_note)}
        />
      </Field>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <RerequestSubmit />
    </form>
  );
}

function LeaveMembershipForm({ membershipId }: { membershipId: string }) {
  const [state, formAction] = useFormState(leaveConnectGroupAction, initialState);

  if (state.ok && state.status === "LEFT") {
    return (
      <Alert tone="success" title="You left this group">
        {state.message}
      </Alert>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Leave this Connect Group? You can request to join again later if the group is open.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="membership_id" value={membershipId} />
      <p className="text-sm font-medium text-ink">You are a member of this Connect Group.</p>
      <p className="text-sm text-ink-muted">
        Leaving ends your active membership. You may request to join again later if the group
        is open; requests are reviewed by the church.
      </p>
      {state.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      <LeaveSubmit />
    </form>
  );
}
