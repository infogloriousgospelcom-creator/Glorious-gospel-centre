"use client";

import { useState } from "react";
import { Container, Section } from "@/components/ui/Container";
import { SectionEyebrow, SectionTitle, SectionLead } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { SectionReveal } from "@/components/motion/SectionReveal";

/**
 * Client-only invite/share — no recipient storage, analytics, or WhatsApp API.
 */
export function InviteSomeone({
  inviteUrl,
  churchName = "Glorious Gospel Centre Church",
}: {
  inviteUrl: string;
  churchName?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const message = `Join me for worship at ${churchName}. Plan your visit: ${inviteUrl}`;

  async function shareNative() {
    setStatus(null);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Invite to ${churchName}`,
          text: `Join me for worship at ${churchName}.`,
          url: inviteUrl,
        });
        setStatus("Shared — thank you.");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copyInvite();
  }

  async function copyInvite() {
    setStatus(null);
    try {
      await navigator.clipboard.writeText(message);
      setStatus("Invitation copied. Paste it into a message to a friend.");
    } catch {
      setStatus("Copy is unavailable in this browser. Share the visit page link manually.");
    }
  }

  function shareWhatsApp() {
    setStatus(null);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareFacebook() {
    setStatus(null);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Section id="invite" className="bg-accent-50">
      <Container width="prose" className="text-center">
        <SectionReveal>
          <SectionEyebrow className="text-accent-700">Invite someone</SectionEyebrow>
          <SectionTitle>Invite someone to worship with you</SectionTitle>
          <SectionLead>
            Share GGCC with a friend. Sharing happens on your device — we do not store who you
            invite.
          </SectionLead>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button type="button" onClick={shareNative}>
              Share
            </Button>
            <Button type="button" variant="secondary" onClick={copyInvite}>
              Copy invitation
            </Button>
            <Button type="button" variant="ghost" onClick={shareWhatsApp}>
              WhatsApp
            </Button>
            <Button type="button" variant="ghost" onClick={shareFacebook}>
              Facebook
            </Button>
          </div>

          <p className="mt-4 text-xs text-ink-muted" role="status" aria-live="polite">
            {status ?? "Opens your share sheet or a share link you control."}
          </p>
        </SectionReveal>
      </Container>
    </Section>
  );
}
