import { getCurrentUser } from "@/services/auth";
import {
  findOpenOwnServeInterest,
  listPublishedMinistryOptions,
} from "@/services/ministry-serve-interest";
import { publicMinistryHref } from "@/lib/ministries";
import { ServeInterestForm } from "./ServeInterestForm";

export async function ServeInterestPanel({
  ministrySlug,
}: {
  ministrySlug?: string;
}) {
  const [user, ministries] = await Promise.all([
    getCurrentUser(),
    listPublishedMinistryOptions(),
  ]);
  const selected = ministrySlug
    ? ministries.find((m) => m.slug === ministrySlug)
    : undefined;
  const existing = user
    ? await findOpenOwnServeInterest({ ministryId: selected?.id ?? null })
    : null;
  const returnPath = selected ? publicMinistryHref(selected.slug) : "/serve";
  const loginHref = `/login?redirect_to=${encodeURIComponent(returnPath)}`;

  return (
    <ServeInterestForm
      ministries={ministries}
      selectedMinistryId={selected?.id ?? null}
      selectedMinistryName={selected?.name ?? null}
      loginHref={loginHref}
      isAuthenticated={Boolean(user)}
      emailConfirmed={Boolean(user?.emailConfirmed)}
      existing={selected ? existing : null}
    />
  );
}
