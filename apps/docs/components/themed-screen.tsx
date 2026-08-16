import { ChangelogSidebarItem } from "@/components/previews/changelog-demo";
import { ChartDemo } from "@/components/previews/chart-demo";
import { DataTableDemo } from "@/components/previews/data-table-demo";
import { Badge } from "@/components/ui/badge";
import { AppWindow, Boxes, LayoutDashboard, Search, Settings } from "lucide-react";

/**
 * One realistic Platform screen, composed from demos that already exist.
 *
 * The catalog proves 63 components render. It does not prove the tokens hold up at
 * screen scale, which is the actual question a team asks before adopting: does an
 * information-dense internal tool look right in this theme, with no shadows and a
 * tight radius? This is the smallest artifact that answers it.
 *
 * Deliberately static and non-interactive. It is an illustration of the theme, not
 * a second app to maintain.
 */

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Applications", icon: Boxes, active: false },
  { label: "Environments", icon: AppWindow, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const STATS = [
  { label: "Applications", value: "24", note: "across 6 teams" },
  { label: "On the current theme", value: "19", note: "5 behind by one minor" },
  { label: "Failing checks", value: "2", note: "both in staging" },
];

const ACTIVITY = [
  { label: "ui-theme 0.1.0 published", dot: "bg-success" },
  { label: "capacity-tool upgraded", dot: "bg-info" },
  { label: "billing-portal check failed", dot: "bg-destructive" },
  { label: "docs deploy succeeded", dot: "bg-success" },
];

export function ThemedScreen() {
  return (
    <div className="not-prose overflow-hidden rounded-lg border border-border">
      <div className="flex min-h-[34rem]">
        {/* Sidebar: the surface that needed the --sidebar token group. */}
        <aside className="hidden w-52 shrink-0 flex-col border-border border-r bg-sidebar p-3 sm:flex">
          <p className="px-2 pb-3 font-semibold text-sidebar-foreground text-sm">Platform</p>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <span
                key={item.label}
                className={[
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
                  item.active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80",
                ].join(" ")}
              >
                <item.icon aria-hidden className="size-4 shrink-0" />
                {item.label}
              </span>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="border-sidebar-border border-t pt-2">
            <ChangelogSidebarItem />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          {/* Header */}
          <header className="flex items-center gap-3 border-border border-b px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input px-2.5 py-1.5">
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground text-sm">Search applications</span>
            </div>
            <Badge variant="secondary">Production</Badge>
          </header>

          <div className="flex flex-col gap-4 overflow-hidden p-4">
            <div>
              <h3 className="font-semibold text-foreground text-lg">Overview</h3>
              <p className="text-muted-foreground text-sm">
                Theme adoption across Platform applications.
              </p>
            </div>

            {/* Stat tiles: border plus surface, never a shadow. */}
            <div className="grid gap-3 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                  <p className="mt-1 font-semibold text-2xl text-card-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-muted-foreground text-xs">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <div className="rounded-lg border border-border bg-card p-3 lg:col-span-3">
                <p className="mb-2 font-medium text-card-foreground text-sm">Adoption over time</p>
                <ChartDemo />
              </div>
              <div className="min-w-0 rounded-lg border border-border bg-card p-3 lg:col-span-2">
                <p className="mb-2 font-medium text-card-foreground text-sm">Recent activity</p>
                <ul className="flex flex-col gap-2 text-sm">
                  {ACTIVITY.map((entry) => (
                    <li key={entry.label} className="flex items-center gap-2">
                      {/* Full class strings, not `bg-${tone}`: Tailwind scans source
                          text and cannot see a class name built at runtime. */}
                      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${entry.dot}`} />
                      <span className="truncate text-muted-foreground">{entry.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* The published DataTable, doing the job it exists for. */}
            <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-card">
              <DataTableDemo />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
