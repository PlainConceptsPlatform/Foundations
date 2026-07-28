import { source } from "@/lib/source";
import { AppWindow, Bot, Boxes, Palette, Rocket, Server } from "lucide-react";
import Link from "next/link";

/**
 * The front door is a lobby, not a pitch: say what this is, then route the three
 * audiences (React app teams, .NET teams, agent tooling) to where they need to go.
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
    slug: ["getting-started"],
    href: "/docs/getting-started",
    icon: Rocket,
    fallback: {
      title: "Getting started",
      description: "Install the theme and get a themed app running.",
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
      title: "AI",
      description: "Tools that prepare a codebase for agents and run them on a cadence.",
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
            The shared foundation for Platform apps
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Platform Foundations keeps many independent apps consistent without a heavy in-house
            framework. It ships tokens and conventions, not a component library.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/getting-started"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[var(--pc-blue-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Read the docs
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
      </div>
    </main>
  );
}
