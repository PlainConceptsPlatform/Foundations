"use client";

import {
  type DataTableColumn,
  type DataTableIcons,
  type DataTableSlots,
  type DataTableTexts,
  DataTable as PackageDataTable,
} from "@plainconceptsplatform/ui-components/data-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Columns3,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Pre-wired slots for the Foundations docs app.
// Cast is safe: shadcn components accept a superset of the minimal prop types.
const slots = {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} as DataTableSlots;

// English texts (the docs site is English-only).
const texts: DataTableTexts = {
  dragToGroup: "Drag a column header here to group by that column",
  groupedBy: "Grouped by",
  stopGrouping: (label) => `Stop grouping ${label}`,
  clear: "Clear",
  columnsCount: (v, t) => `Columns (${v}/${t})`,
  toggleColumns: "Toggle columns",
  noRecords: "No records",
  dragReorderOrGroup: "Drag to reorder or group",
  dragReorder: "Drag to reorder",
  columnGrouping: "Column grouping",
  resizeColumn: "Drag to resize column",
};

// Lucide icon adapters.
const icons: DataTableIcons = {
  IconSortAscending: ({ className }) => <ArrowUp className={className} />,
  IconSortDescending: ({ className }) => <ArrowDown className={className} />,
  IconArrowsSort: ({ className }) => <ArrowUpDown className={className} />,
  IconChevronRight: ({ size }) => <ChevronRight size={size} />,
  IconChevronDown: ({ size }) => <ChevronDown size={size} />,
  IconColumns: ({ className }) => <Columns3 className={className} />,
  IconX: ({ className }) => <X className={className} />,
};

// Re-export the types so consuming code can import from here.
export type {
  DataTableColumn,
  SortOrder,
  SortState,
} from "@plainconceptsplatform/ui-components/data-table";

type DataTableWrapperProps<T> = Omit<
  Parameters<typeof PackageDataTable<T>>[0],
  "slots" | "texts" | "icons"
>;

/**
 * Foundations DataTable - a thin wrapper around the package component
 * with all shadcn/lucide/i18n slots pre-wired.
 */
export function DataTable<T>(props: DataTableWrapperProps<T>) {
  return <PackageDataTable<T> {...props} slots={slots} texts={texts} icons={icons} />;
}
