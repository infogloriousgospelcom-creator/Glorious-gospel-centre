import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/services/auth";

/** Server wrapper for the public site header. */
export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <Navbar
      accountHref={user ? "/account" : "/login"}
      accountLabel={user ? "Account" : "Sign in"}
    />
  );
}
