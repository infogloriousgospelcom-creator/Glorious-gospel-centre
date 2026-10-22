import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OrphansPage() {
  redirect("/ministries/hospitality/orphans");
}
