"use client";

import { useEffect, useId, useState } from "react";

/** Reads a resolved theme token off the document root. */
function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Mermaid theming, driven by the Platform tokens rather than Mermaid's stock
 * `default` and `dark` palettes, so diagrams match the surrounding page in both
 * modes instead of introducing a third colour language.
 */
function themeVariables() {
  const background = token("--background", "#ffffff");
  const foreground = token("--foreground", "#0d0e0f");
  const primary = token("--primary", "#2f69ff");
  const border = token("--border", "#e9eaf2");
  const muted = token("--muted", "#f2f3f7");
  const mutedForeground = token("--muted-foreground", "#6a6f74");
  const accent = token("--accent", "#ebf0ff");
  const accentForeground = token("--accent-foreground", "#0032b2");

  return {
    background,
    // Nodes read as cards: an accent surface with a brand border, matching the
    // "elevation is border plus surface" rule rather than Mermaid's default fills.
    primaryColor: accent,
    primaryTextColor: accentForeground,
    primaryBorderColor: primary,
    secondaryColor: muted,
    secondaryTextColor: foreground,
    secondaryBorderColor: border,
    tertiaryColor: background,
    tertiaryTextColor: foreground,
    tertiaryBorderColor: border,
    lineColor: mutedForeground,
    textColor: foreground,
    mainBkg: accent,
    nodeBorder: primary,
    clusterBkg: muted,
    clusterBorder: border,
    edgeLabelBackground: background,
    fontFamily: "var(--font-sans, Outfit, system-ui, sans-serif)",
    fontSize: "14px",
  };
}

/** Renders a mermaid diagram client-side, themed by the Platform tokens. */
export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  // Bumped when the colour scheme changes, to force a re-render. Without this a
  // diagram rendered in light mode kept its light colours after toggling to dark.
  const [scheme, setScheme] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setScheme((n) => n + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        // `base` is the only built-in theme that honours themeVariables fully.
        theme: "base",
        darkMode: dark,
        securityLevel: "strict",
        themeVariables: themeVariables(),
      });

      try {
        const rendered = await mermaid.render(`${id}-${scheme}`, chart);
        if (active) setSvg(rendered.svg);
      } catch {
        // Fall back to the source rather than blanking the page.
        if (active) setSvg("");
      }
    })();

    return () => {
      active = false;
    };
  }, [chart, id, scheme]);

  if (!svg) {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm">
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid returns SVG we generated from repo-authored source
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
