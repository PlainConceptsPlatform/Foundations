"use client";

import { useEffect, useId, useState } from "react";

/** Renders a mermaid diagram client-side, theme-aware. Used for ```mermaid blocks. */
export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.classList.contains("dark");
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "var(--font-sans, Outfit, system-ui, sans-serif)",
      });
      try {
        const { svg } = await mermaid.render(id, chart);
        if (active) setSvg(svg);
      } catch {
        if (active) setSvg("");
      }
    })();
    return () => {
      active = false;
    };
  }, [chart, id]);

  if (!svg) {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm">
        {chart}
      </pre>
    );
  }

  // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid returns trusted SVG we generated
  return <div className="my-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
}
