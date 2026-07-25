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
};

const apps: App[] = [
  { id: "1", name: "Numa", stack: "React", status: "Active", team: "Platform" },
  { id: "2", name: "Docs", stack: "Next.js", status: "Active", team: "Platform" },
  { id: "3", name: "Legacy", stack: ".NET", status: "Deprecated", team: "Enterprise" },
  { id: "4", name: "Insights", stack: "Next.js", status: "Active", team: "Data" },
  { id: "5", name: "Atlas", stack: "React", status: "Active", team: "Platform" },
  { id: "6", name: "Pulse", stack: "Next.js", status: "Active", team: "Data" },
  { id: "7", name: "Hub", stack: ".NET", status: "Deprecated", team: "Enterprise" },
  { id: "8", name: "Flow", stack: "React", status: "Active", team: "Platform" },
];

const columns: DataTableColumn<App>[] = [
  {
    key: "name",
    label: "App",
    render: (r) => <span className="font-medium">{r.name}</span>,
    sortValue: (r) => r.name,
    groupValue: (r) => r.stack,
  },
  {
    key: "stack",
    label: "Stack",
    render: (r) => r.stack,
    sortValue: (r) => r.stack,
  },
  {
    key: "team",
    label: "Team",
    render: (r) => r.team,
    sortValue: (r) => r.team,
  },
  {
    key: "status",
    label: "Status",
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
