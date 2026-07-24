"use client";

import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";

type App = {
  name: string;
  stack: string;
  status: "Active" | "Deprecated";
};

const apps: App[] = [
  { name: "Numa", stack: "React", status: "Active" },
  { name: "Docs", stack: "Next.js", status: "Active" },
  { name: "Legacy", stack: ".NET", status: "Deprecated" },
  { name: "Insights", stack: "Next.js", status: "Active" },
];

const columns: ColumnDef<App>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableSortHeader column={column} label="App" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "stack",
    header: ({ column }) => <DataTableSortHeader column={column} label="Stack" />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

export function DataTableDemo() {
  return (
    <div className="w-full max-w-lg">
      <DataTable columns={columns} data={apps} />
    </div>
  );
}
