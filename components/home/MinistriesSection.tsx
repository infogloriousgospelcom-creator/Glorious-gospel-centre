import { Container, Section } from "@/components/ui/Container";
import { EmptyState, SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { getFeaturedMinistries } from "@/services/content";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { MinistryCard } from "@/components/ministries/MinistryCard";

export async function MinistriesSection() {
  const ministries = await getFeaturedMinistries(6);

  return (
    <Section>
      <Container>
        <SectionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <SectionEyebrow>Get involved</SectionEyebrow>
            <SectionTitle>Our ministries</SectionTitle>
            <SectionLead>
              Find a place to belong, grow, and serve — from children and youth to worship and
              hospitality.
            </SectionLead>
          </div>
        </SectionReveal>

        {ministries.length === 0 ? (
          <EmptyState
            title="Ministries coming soon"
            description="Add ministries in the admin to populate this section."
          />
        ) : (
          <SectionReveal delay={0.1}>
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((m) => (
                <MinistryCard key={m.id} ministry={m} />
              ))}
            </ul>
          </SectionReveal>
        )}

        <SectionReveal delay={0.18}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/ministries">Explore All Ministries</LinkButton>
            <LinkButton href="/serve" variant="secondary">
              Serve at GGCC
            </LinkButton>
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
