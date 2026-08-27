import { ThemedScreen } from "@/components/themed-screen";
import { source } from "@/lib/source";
import {
  Activity,
  AppWindow,
  Bot,
  Boxes,
  Gauge,
  GitBranch,
  Layers,
  Palette,
  type Rocket,
  Route,
  Server,
  Workflow,
  Wrench,
} from "lucide-react";
import Link from "next/link";

/**
 * The front door is a lobby, not a pitch: say what this is, then route the two
 * readers (anyone curious how the department works, and an engineer setting up
 * a Platform project) to where they need to go.
 *
 * Card copy is read from each target page's frontmatter rather than written here,
 * so the homepage cannot drift from the pages it describes. Everything is built
 * from the tokens this repo publishes: border + bg-card for elevation (the theme
 * ships no shadows), --radius for corners, and 150ms colour-only transitions.
 */

type Destination = {
  slug: string[];
  href: string;
  icon: typeof Rocket;
  /** Used only if the page or its description goes missing, so the build never breaks. */
  fallback: { title: string; description: string };
};

const DESTINATIONS: Destination[] = [
  {
    slug: ["how-we-work"],
    href: "/docs/how-we-work",
    icon: Route,
    fallback: {
      title: "How we work",
      description: "The three phases a Platform app goes through, and who starts a change in each.",
    },
  },
  {
    slug: ["how-we-work", "metrics"],
    href: "/docs/how-we-work/metrics",
    icon: Activity,
    fallback: {
      title: "DORA in an agentic world",
      description:
        "What DORA still measures once agents ship the changes, and what has to be added.",
    },
  },
  {
    slug: ["frontend"],
    href: "/docs/frontend",
    icon: AppWindow,
    fallback: {
      title: "Frontend",
      description: "The React stack, architecture, theming, and components.",
    },
  },
  {
    slug: ["backend"],
    href: "/docs/backend",
    icon: Server,
    fallback: { title: "Backend", description: "The .NET conventions and architecture." },
  },
  {
    slug: ["ai"],
    href: "/docs/ai",
    icon: Bot,
    fallback: {
      title: "Run agents",
      description:
        "How agents run against a repository: the workflows, the harness, and the metrics.",
    },
  },
  {
    slug: ["ai", "workflows"],
    href: "/docs/ai/workflows",
    icon: Workflow,
    fallback: {
      title: "Workflows",
      description:
        "GitHub Agentic Workflows: one router and many workers, the label state machine, and the determinism ladder.",
    },
  },
  {
    slug: ["tokens"],
    href: "/docs/tokens",
    icon: Palette,
    fallback: { title: "Tokens", description: "The design tokens every Platform app installs." },
  },
  {
    slug: ["components"],
    href: "/docs/components",
    icon: Boxes,
    fallback: { title: "Components", description: "The themed shadcn/ui catalog." },
  },
];

/**
 * The four repositories the whole way of working rests on. Listed here rather than
 * only in the docs because they are the most important artifacts we have, all four
 * are public, and the front door should say so. Copy is written here because these
 * point at GitHub rather than at a page with frontmatter to read.
 */
type Pillar = {
  name: string;
  repo: string;
  href: string;
  icon: typeof Rocket;
  description: string;
};

const PILLARS: Pillar[] = [
  {
    name: "Foundations",
    repo: "PlainConceptsPlatform/Foundations",
    href: "https://github.com/PlainConceptsPlatform/Foundations",
    icon: Layers,
    description: "The theme, the conventions, the reference architecture, and this site.",
  },
  {
    name: "agent-harness",
    repo: "PlainConceptsPlatform/agent-harness",
    href: "https://github.com/PlainConceptsPlatform/agent-harness",
    icon: Wrench,
    description:
      "Installs the Platform Harness into a repository: skills, commands, an agent team, and an OpenSpec workspace.",
  },
  {
    name: "agentic-workflows",
    repo: "PlainConceptsPlatform/agentic-workflows",
    href: "https://github.com/PlainConceptsPlatform/agentic-workflows",
    icon: GitBranch,
    description:
      "The router and worker catalog that runs the pipeline, plus the CLI that installs and updates it.",
  },
  {
    name: "project-health",
    repo: "PlainConceptsPlatform/project-health",
    href: "https://github.com/PlainConceptsPlatform/project-health",
    icon: Gauge,
    description: "Delivery and agent metrics, collected from GitHub and published as a site.",
  },
];

function resolve(destination: Destination) {
  const page = source.getPage(destination.slug);
  const data = page?.data as { title?: string; description?: string } | undefined;

  return {
    title: data?.title ?? destination.fallback.title,
    description: data?.description ?? destination.fallback.description,
  };
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <div className="w-full max-w-5xl">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            The way Platform builds software
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Platform is a department at Plain Concepts. Its apps share one look through tokens,
            follow the same conventions, and are maintained by agents inside guardrails that make
            that safe. This site is the method written down: read it to see how we work, or follow
            it to set up a project of your own.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/how-we-work"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[var(--pc-blue-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              How we work
            </Link>
            <Link
              href="/docs/how-we-work/start"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start a project
            </Link>
          </div>
        </section>

        <nav aria-label="Documentation sections" className="mt-16">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINATIONS.map((destination) => {
              const { title, description } = resolve(destination);
              const Icon = destination.icon;

              return (
                <li key={destination.href}>
                  <Link
                    href={destination.href}
                    className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon aria-hidden className="size-5 text-primary" />
                    <span className="mt-3 font-semibold text-card-foreground">{title}</span>
                    <span className="mt-1 text-sm text-muted-foreground">{description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="mt-20">
          <h2 className="font-semibold text-xl tracking-tight">The four pillars</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Four repositories carry the whole way of working, set out in{" "}
            <Link href="/docs/how-we-work" className="text-primary hover:underline">
              How we work
            </Link>
            . Foundations sets the conventions, agent-harness puts them into a repository as
            something agents can act on, agentic-workflows runs the agents against it, and
            project-health reports on what came out.
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <li key={pillar.href}>
                  <a
                    href={pillar.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon aria-hidden className="size-5 text-primary" />
                    <span className="mt-3 font-semibold text-card-foreground">{pillar.name}</span>
                    <span className="mt-1 text-sm text-muted-foreground">{pillar.description}</span>
                    <span className="mt-3 font-mono text-xs text-muted-foreground">
                      {pillar.repo}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-20">
          <h2 className="font-semibold text-xl tracking-tight">The theme at screen scale</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            An information-dense internal tool built only from the published tokens: elevation is a
            border and a surface, corners are one radius, and nothing casts a shadow. Composed from
            the same component demos in the{" "}
            <Link href="/docs/components" className="text-primary hover:underline">
              catalog
            </Link>
            .
          </p>

          <div className="mt-6">
            <ThemedScreen />
          </div>
        </section>
      </div>
    </main>
  );
}
