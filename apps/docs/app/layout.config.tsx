import { siteName, themeVersion } from "@/lib/site";
import { PlainLogo } from "@plainconceptsplatform/ui-components";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/** Shared nav/branding for every layout. */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        {/* PlainLogo picks its form from the container width; 2rem shows the mark. */}
        <span className="block w-8 shrink-0">
          <PlainLogo />
        </span>
        <span className="font-semibold">{siteName}</span>
        {/* A trust signal, not decoration, so it stays plain and muted. */}
        <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          v{themeVersion}
        </span>
      </>
    ),
    url: "/",
  },
  links: [
    { text: "Getting started", url: "/docs/getting-started" },
    { text: "Frontend", url: "/docs/frontend" },
    { text: "Components", url: "/docs/components" },
    { text: "Tokens", url: "/docs/tokens" },
  ],
  githubUrl: "https://github.com/PlainConceptsPlatform/Foundations",
};
