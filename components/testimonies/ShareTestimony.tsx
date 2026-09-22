"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Client-only share for approved public testimony URLs.
 * Never shares story body or private submitter data.
 */
export function ShareTestimony({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const teaser = `A Story of Grace from Glorious Gospel Centre Church: ${title}`;

  async function shareNative() {
    setStatus(null);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: teaser, text: teaser, url });
        setStatus("Shared — thank you.");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function copyLink() {
    setStatus(null);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Copy is unavailable in this browser.");
    }
  }

  function shareWhatsApp() {
    setStatus(null);
    const text = `${teaser}\n${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareFacebook() {
    setStatus(null);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={shareNative}>
          Share
        </Button>
        <Button type="button" variant="secondary" onClick={copyLink}>
          Copy link
        </Button>
        <Button type="button" variant="ghost" onClick={shareWhatsApp}>
          WhatsApp
        </Button>
        <Button type="button" variant="ghost" onClick={shareFacebook}>
          Facebook
        </Button>
      </div>
      {status ? (
        <p className="text-sm text-ink-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
