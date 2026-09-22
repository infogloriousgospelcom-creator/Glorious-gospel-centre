import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { countPublicConnectGroups } from "@/services/connect-groups";

/**
 * Connect invitation — links to /connect when groups exist, otherwise ministries/contact.
 */
export async function ConnectAtGgcc() {
  const count = await countPublicConnectGroups();
  const hasGroups = count > 0;

  return (
    <Section>
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow>Community</SectionEyebrow>
          <SectionTitle>Connect at GGCC</SectionTitle>
          <SectionLead className="mx-auto">
            Faith grows in relationship — through Sunday worship, ministries, prayer, and
            Connect Groups.{" "}
            {hasGroups
              ? "Explore a group that fits your season of life."
              : "Explore a ministry that fits where you are, or speak with us about taking a next step."}
          </SectionLead>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hasGroups ? (
              <>
                <LinkButton href="/connect">Explore Connect Groups</LinkButton>
                <LinkButton href="/contact" variant="secondary">
                  Contact Us
                </LinkButton>
              </>
            ) : (
              <>
                <LinkButton href="/connect">What are Connect Groups?</LinkButton>
                <LinkButton href="/ministries" variant="secondary">
                  Explore Ministries
                </LinkButton>
              </>
            )}
          </div>
        </SectionReveal>
      </Container>
    </Section>
  );
}
