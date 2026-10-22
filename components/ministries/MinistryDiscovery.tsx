import { SectionEyebrow } from "@/components/ui/Section";
import { MinistryCard } from "@/components/ministries/MinistryCard";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { groupMinistriesForDiscovery } from "@/lib/ministries";
import type { MinistryItem } from "@/types/content";

export function MinistryDiscovery({ ministries }: { ministries: MinistryItem[] }) {
  const groups = groupMinistriesForDiscovery(ministries);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-16">
      {groups.map(({ category, ministries: items }, index) => (
        <SectionReveal key={category.title} delay={index * 0.06}>
          <section aria-labelledby={`ministry-group-${category.id}`}>
            <div className="mb-8 max-w-2xl">
              <SectionEyebrow>Discover</SectionEyebrow>
              <h2
                id={`ministry-group-${category.id}`}
                className="mt-2 font-display text-2xl font-semibold text-brand-900 sm:text-3xl"
              >
                {category.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
                {category.description}
              </p>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <MinistryCard
                  key={m.id}
                  ministry={m}
                  featured={m.slug === "children" || m.slug === "hospitality"}
                />
              ))}
            </ul>
          </section>
        </SectionReveal>
      ))}
    </div>
  );
}
