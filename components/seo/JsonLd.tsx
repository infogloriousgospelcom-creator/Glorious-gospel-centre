import type { ReactNode } from "react";

/**
 * Render a single JSON-LD block. Multiple blocks can be rendered on
 * one page; search engines and crawlers merge them.
 *
 * Usage:
 *
 *   <JsonLd data={buildChurchSchema(...)} />
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // The data is generated server-side from controlled inputs.
          // We never include user-supplied HTML inside JSON-LD.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}

export type { ReactNode };