import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const migrationSrc = read("supabase/migrations/0038_leader_category.sql");
const rlsSrc = read("supabase/migrations/0009_rls_policies.sql");
const pagesSrc = read("services/pages.ts");
const leadersAdminSrc = read("services/admin/leaders.ts");
const leadersReadSrc = read("services/admin/leaders.read.ts");
const typesSrc = read("types/content.ts");
const leaderGridSrc = read("components/about/CmsPageView.tsx");
const leaderFormSrc = read("components/admin/LeaderForm.tsx");
const leaderListSrc = read("components/admin/LeaderAdminList.tsx");
const pastorsPageSrc = read("app/about/pastors/page.tsx");
const leadershipPageSrc = read("app/about/leadership/page.tsx");
const aboutSubnavSrc = read("components/layout/AboutSubnav.tsx");
const navbarSrc = read("components/layout/Navbar.tsx");
const footerSrc = read("components/layout/Footer.tsx");
const adminSidebarSrc = read("components/layout/AdminSidebar.tsx");
const sitemapSrc = read("app/sitemap.ts");
const pastorsAdminListSrc = read("app/admin/(protected)/pastors/page.tsx");
const pastorsAdminNewSrc = read("app/admin/(protected)/pastors/new/page.tsx");
const pastorsAdminEditSrc = read("app/admin/(protected)/pastors/[id]/page.tsx");
const leadershipAdminListSrc = read("app/admin/(protected)/leadership/page.tsx");
const leadershipAdminNewSrc = read("app/admin/(protected)/leadership/new/page.tsx");
const leadershipAdminEditSrc = read("app/admin/(protected)/leadership/[id]/page.tsx");

function sliceBetween(src: string, start: string, end: string): string {
  const a = src.indexOf(start);
  const b = src.indexOf(end);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return src.slice(a, b);
}

/** Body of one exported function, up to the next export (or end of file). */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThan(-1);
  const rest = src.slice(start + 1);
  const next = rest.indexOf("\nexport async function ");
  return next === -1 ? src.slice(start) : src.slice(start, start + 1 + next);
}

describe("pastors — schema migration", () => {
  it("adds a leader_category enum with PASTOR and LEADERSHIP", () => {
    expect(migrationSrc).toMatch(/create type public\.leader_category as enum/);
    expect(migrationSrc).toMatch(/'PASTOR'/);
    expect(migrationSrc).toMatch(/'LEADERSHIP'/);
  });

  it("adds the category column with a backfilling default", () => {
    expect(migrationSrc).toMatch(
      /add column if not exists category public\.leader_category not null default 'LEADERSHIP'/,
    );
  });

  it("is additive and non-destructive", () => {
    expect(migrationSrc).not.toMatch(/drop table/i);
    expect(migrationSrc).not.toMatch(/drop column/i);
    expect(migrationSrc).not.toMatch(/delete from/i);
    expect(migrationSrc).not.toMatch(/truncate/i);
    expect(migrationSrc).not.toMatch(/rename column/i);
  });

  it("does not weaken or rewrite any RLS policy", () => {
    expect(migrationSrc).not.toMatch(/create policy/i);
    expect(migrationSrc).not.toMatch(/alter policy/i);
    expect(migrationSrc).not.toMatch(/disable row level security/i);
  });

  it("exposes the category type on the shared LeaderItem type", () => {
    expect(typesSrc).toMatch(/export type LeaderCategory = "PASTOR" \| "LEADERSHIP"/);
    expect(typesSrc).toMatch(/category: LeaderCategory;/);
  });
});

describe("pastors — RLS mirrors leadership", () => {
  it("public select stays published-only", () => {
    expect(rlsSrc).toMatch(/leaders_public_select on public\.leaders/);
    const policy = sliceBetween(rlsSrc, "leaders_public_select on public.leaders", "drop policy if exists leaders_admin_write");
    expect(policy).toMatch(/using \(public\.is_published\(status\)\)/);
  });

  it("admin write stays gated by content.manage for both using and with check", () => {
    const policy = sliceBetween(
      rlsSrc,
      "leaders_admin_write on public.leaders",
      "drop policy if exists ministries_public_select",
    );
    expect(policy).toMatch(/using \(public\.has_permission\('content\.manage'\)\)/);
    expect(policy).toMatch(/with check \(public\.has_permission\('content\.manage'\)\)/);
  });

  it("never uses service-role credentials in leader data access", () => {
    expect(leadersAdminSrc).not.toMatch(/service_role|SERVICE_ROLE|createServiceRoleClient/);
    expect(leadersReadSrc).not.toMatch(/service_role|SERVICE_ROLE|createServiceRoleClient/);
    expect(pagesSrc).not.toMatch(/service_role|SERVICE_ROLE|createServiceRoleClient/);
  });
});

describe("pastors — public data access", () => {
  const pastorsFn = sliceBetween(
    pagesSrc,
    "export async function getAllPublishedPastors",
    "export async function getAllPublishedPages",
  );
  const leadersFn = sliceBetween(
    pagesSrc,
    "export async function getAllPublishedLeaders",
    "export async function getAllPublishedPastors",
  );

  it("queries only published pastors", () => {
    expect(pastorsFn).toMatch(/\.from\("leaders"\)/);
    expect(pastorsFn).toMatch(/\.eq\("status", "PUBLISHED"\)/);
    expect(pastorsFn).toMatch(/\.eq\("category", "PASTOR"\)/);
  });

  it("keeps the shared display order (sort_order, then full_name)", () => {
    expect(pastorsFn).toMatch(/\.order\("sort_order", \{ ascending: true \}\)/);
    expect(pastorsFn).toMatch(/\.order\("full_name", \{ ascending: true \}\)/);
  });

  it("returns a safe public column list with no audit/owner fields", () => {
    expect(pastorsFn).toMatch(/select\(\s*"id,full_name,title,bio,image_url,email,phone,sort_order,is_featured,category"/);
    expect(pastorsFn).not.toMatch(/created_by|updated_by|published_at/);
  });

  it("leadership still returns every published leader (no category filter)", () => {
    expect(leadersFn).toMatch(/\.eq\("status", "PUBLISHED"\)/);
    expect(leadersFn).not.toMatch(/\.eq\("category"/);
  });
});

describe("pastors — public page", () => {
  it("renders the pastors route with the shared leadership building blocks", () => {
    expect(pastorsPageSrc).toMatch(/getAllPublishedPastors/);
    expect(pastorsPageSrc).toMatch(/<LeaderGrid/);
    expect(pastorsPageSrc).toMatch(/<AboutSubnav active="\/about\/pastors" \/>/);
    expect(pastorsPageSrc).toMatch(/export const dynamic = "force-dynamic"/);
  });

  it("is indexable with its own canonical metadata", () => {
    expect(pastorsPageSrc).toMatch(/path: "\/about\/pastors"/);
    expect(pastorsPageSrc).toMatch(/title: "Pastors"/);
    expect(pastorsPageSrc).toMatch(/buildPageMetadata/);
    expect(pastorsPageSrc).not.toMatch(/noindex/);
    expect(pastorsPageSrc).not.toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it("has a pastors-specific empty state", () => {
    expect(pastorsPageSrc).toMatch(/emptyTitle="Pastors coming soon"/);
    expect(leaderGridSrc).toMatch(/emptyTitle = "Leadership team coming soon"/);
    expect(leaderGridSrc).toMatch(/emptyDescription = "Add leaders in the admin to introduce them here\."/);
  });
});

describe("pastors — admin access", () => {
  it("every pastors admin route requires an admin session", () => {
    expect(pastorsAdminListSrc).toMatch(/await requireAdmin\(\)/);
    expect(pastorsAdminNewSrc).toMatch(/await requireAdmin\(\)/);
    expect(pastorsAdminEditSrc).toMatch(/await requireAdmin\(\)/);
  });

  it("admin routes are excluded from indexing", () => {
    expect(pastorsAdminListSrc).toMatch(/robots: \{ index: false, follow: false \}/);
    expect(pastorsAdminNewSrc).toMatch(/robots: \{ index: false, follow: false \}/);
    expect(pastorsAdminEditSrc).toMatch(/robots: \{ index: false, follow: false \}/);
  });

  it("pastors list is scoped to the PASTOR category", () => {
    expect(pastorsAdminListSrc).toMatch(/listAllLeaders\("PASTOR"\)/);
    expect(leadersReadSrc).toMatch(/if \(category\) query = query\.eq\("category", category\)/);
  });

  it("reuses the shared leadership form and list components", () => {
    for (const src of [pastorsAdminListSrc, leadershipAdminListSrc]) {
      expect(src).toMatch(/LeaderAdminList/);
    }
    for (const src of [pastorsAdminNewSrc, pastorsAdminEditSrc, leadershipAdminNewSrc, leadershipAdminEditSrc]) {
      expect(src).toMatch(/from "@\/components\/admin\/LeaderForm"/);
    }
    expect(existsSync(resolve(process.cwd(), "app/admin/(protected)/leadership/_components/LeaderForm.tsx"))).toBe(false);
    expect(leaderFormSrc).toMatch(/name="category"/);
    expect(leaderListSrc).toMatch(/\$\{basePath\}\/new/);
  });
});

describe("pastors — server actions, permissions, validation", () => {
  const actionBody = (name: string) => fnBody(leadersAdminSrc, name);

  it("guards every mutation with the content.manage permission", () => {
    expect(leadersAdminSrc).toMatch(/await supabase\.rpc\("has_permission", \{ permission_key: "content\.manage" \}\)/);
    for (const fn of ["uploadLeaderImage", "createLeader", "updateLeader", "deleteLeader"]) {
      const body = actionBody(fn);
      expect(body).toMatch(/const auth = await assertContentManager\(\);/);
      expect(body).toMatch(/if \(!auth\.ok\) return \{ ok: false, message: auth\.error \};/);
    }
  });

  it("rejects invalid ids and out-of-scope values", () => {
    expect(actionBody("updateLeader")).toMatch(/\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(id\)/);
    expect(actionBody("deleteLeader")).toMatch(/\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(id\)/);
  });

  it("validates the category field as a closed enum", () => {
    expect(leadersAdminSrc).toMatch(/const CATEGORIES = \["PASTOR", "LEADERSHIP"\] as const;/);
    expect(leadersAdminSrc).toMatch(/category: z\.enum\(CATEGORIES\)\.default\("LEADERSHIP"\)/);
    expect(actionBody("createLeader")).toMatch(/category: d\.category/);
    expect(actionBody("updateLeader")).toMatch(/category: d\.category/);
  });

  it("requires a name and stamps the acting user on create", () => {
    expect(leadersAdminSrc).toMatch(/full_name: z\.string\(\)\.trim\(\)\.min\(2, "Name is required\."\)/);
    expect(actionBody("createLeader")).toMatch(/created_by: auth\.userId, updated_by: auth\.userId/);
  });

  it("keeps image uploads on the leader-images bucket with sniffing and size limits", () => {
    expect(leadersAdminSrc).toMatch(/const BUCKET = "leader-images";/);
    expect(leadersAdminSrc).toMatch(/const MAX_SIZE = 5 \* 1024 \* 1024;/);
    expect(leadersAdminSrc).toMatch(/sniffImageFile/);
    expect(leadersAdminSrc).toMatch(/upsert: false/);
  });

  it("revalidates both leadership and pastors surfaces after mutations", () => {
    for (const fn of ["createLeader", "updateLeader", "deleteLeader"]) {
      const body = actionBody(fn);
      expect(body).toMatch(/revalidatePath\("\/about\/leadership"\)/);
      expect(body).toMatch(/revalidatePath\("\/about\/pastors"\)/);
      expect(body).toMatch(/revalidatePath\("\/admin\/pastors"\)/);
      expect(body).toMatch(/invalidateCache\("featured-leaders"\)/);
    }
  });
});

describe("pastors — navigation & sitemap", () => {
  it("is reachable from every place leadership is represented", () => {
    expect(aboutSubnavSrc).toMatch(/href: "\/about\/pastors", label: "Pastors"/);
    expect(navbarSrc).toMatch(/href: "\/about\/pastors", label: "Pastors"/);
    expect(footerSrc).toMatch(/href: "\/about\/pastors", label: "Pastors"/);
    expect(adminSidebarSrc).toMatch(/href: "\/admin\/pastors", label: "Pastors"/);
    expect(sitemapSrc).toMatch(/"\/about\/pastors"/);
  });

  it("keeps leadership navigation intact", () => {
    expect(aboutSubnavSrc).toMatch(/href: "\/about\/leadership", label: "Leadership"/);
    expect(navbarSrc).toMatch(/href: "\/about\/leadership", label: "Leadership"/);
    expect(footerSrc).toMatch(/href: "\/about\/leadership", label: "Leadership"/);
    expect(adminSidebarSrc).toMatch(/href: "\/admin\/leadership", label: "Leadership"/);
    expect(sitemapSrc).toMatch(/"\/about\/leadership"/);
  });
});

describe("leadership — regression guards", () => {
  it("public leadership page is untouched", () => {
    expect(leadershipPageSrc).toMatch(/getAllPublishedLeaders/);
    expect(leadershipPageSrc).toMatch(/path: "\/about\/leadership"/);
    expect(leadershipPageSrc).toMatch(/<LeaderGrid leaders=\{leaders\} \/>/);
    expect(leadershipPageSrc).toMatch(/<AboutSubnav active="\/about\/leadership" \/>/);
    expect(leadershipPageSrc).not.toMatch(/noindex/);
  });

  it("leadership admin still lists every leader through the shared UI", () => {
    expect(leadershipAdminListSrc).toMatch(/await requireAdmin\(\)/);
    expect(leadershipAdminListSrc).toMatch(/listAllLeaders\(\)/);
    expect(leadershipAdminListSrc).toMatch(/basePath="\/admin\/leadership"/);
    expect(leadershipAdminNewSrc).toMatch(/title: "New leader · Admin"/);
    expect(leadershipAdminEditSrc).toMatch(/deleteLeader/);
    expect(leadershipAdminEditSrc).toMatch(/category: row\.category/);
  });

  it("the featured/home leaders source is unchanged apart from the category column", () => {
    const contentSrc = read("services/content.ts");
    const featured = sliceBetween(contentSrc, "export function getFeaturedLeaders", "export async function getPublishedGalleryAlbums");
    expect(featured).toMatch(/\.eq\("status", "PUBLISHED"\)/);
    expect(featured).toMatch(/\.eq\("is_featured", true\)/);
    expect(featured).not.toMatch(/\.eq\("category"/);
  });
});
