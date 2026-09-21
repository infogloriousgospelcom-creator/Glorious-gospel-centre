import type { ReactNode } from "react";
import { serializeJsonLd } from "@/lib/json-ld";

export { serializeJsonLd };

/**
 * Render a single JSON-LD block. Multiple blocks can be rendered on
 * one page; search engines and crawlers merge them.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
    </>
  );
}

export type { ReactNode };
