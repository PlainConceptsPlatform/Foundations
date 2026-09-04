"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@plainconceptsplatform/ui-components/data-table";

type App = {
  id: string;
  name: string;
  stack: string;
  status: "Active" | "Deprecated";
  team: string;
  description: string;
};

const apps: App[] = [
  {
    id: "1",
    name: "Studio",
    stack: "React",
    status: "Active",
    team: "Platform",
    description: "Internal design-system playground and component showcase for the Platform team.",
  },
  {
    id: "2",
    name: "Docs",
    stack: "Next.js",
    status: "Active",
    team: "Platform",
    description: "Public documentation site built with Fumadocs and the shared UI components.",
  },
  {
    id: "3",
    name: "Legacy",
    stack: ".NET",
    status: "Deprecated",
    team: "Enterprise",
    description: "Old monolith kept alive for a handful of enterprise customers pending migration.",
  },
  {
    id: "4",
    name: "Insights",
    stack: "Next.js",
    status: "Active",
    team: "Data",
    description: "Analytics dashboards aggregating product telemetry across every Platform app.",
  },
  {
    id: "5",
    name: "Console",
    stack: "React",
    status: "Active",
    team: "Platform",
    description: "Admin console for tenant configuration, feature flags and access control.",
  },
  {
    id: "6",
    name: "Pulse",
    stack: "Next.js",
    status: "Active",
    team: "Data",
    description: "Real-time monitoring and alerting service for the data ingestion pipelines.",
  },
  {
    id: "7",
    name: "Hub",
    stack: ".NET",
    status: "Deprecated",
    team: "Enterprise",
    description: "Legacy integration hub connecting on-prem systems to the cloud platform.",
  },
  {
    id: "8",
    name: "Flow",
    stack: "React",
    status: "Active",
    team: "Platform",
    description: "Workflow builder that lets teams automate repetitive operational tasks.",
  },
];

const columns: DataTableColumn<App>[] = [
  {
    key: "name",
    label: "App",
    width: 120,
    render: (r) => <span className="font-medium">{r.name}</span>,
    sortValue: (r) => r.name,
    groupValue: (r) => r.stack,
  },
  {
    key: "stack",
    label: "Stack",
    width: 110,
    render: (r) => r.stack,
    sortValue: (r) => r.stack,
  },
  {
    key: "team",
    label: "Team",
    width: 120,
    render: (r) => r.team,
    sortValue: (r) => r.team,
  },
  {
    key: "description",
    label: "Description",
    width: 240,
    render: (r) => r.description,
    sortValue: (r) => r.description,
  },
  {
    key: "status",
    label: "Status",
    width: 120,
    render: (r) => (
      <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>
    ),
    sortValue: (r) => r.status,
  },
];

export function DataTableDemo() {
  return (
    <div className="w-full">
      <DataTable
        tableId="docs-data-table-demo"
        rows={apps}
        rowKey={(r) => r.id}
        columns={columns}
        defaultGroupBy={["stack"]}
      />
    </div>
  );
}
