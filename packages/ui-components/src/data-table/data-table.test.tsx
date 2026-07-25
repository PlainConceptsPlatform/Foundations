import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  DataTable,
  type DataTableColumn,
  type DataTableIcons,
  type DataTableSlots,
  type DataTableTexts,
} from "./data-table";

// Minimal stubs for slots
const slots: DataTableSlots = {
  Table: ({ children, className }) => <table className={className}>{children}</table>,
  TableHeader: ({ children, className }) => <thead className={className}>{children}</thead>,
  TableBody: ({ children, className }) => <tbody className={className}>{children}</tbody>,
  TableRow: ({ children, className }) => <tr className={className}>{children}</tr>,
  TableHead: ({ children, className, style }) => (
    <th className={className} style={style}>
      {children}
    </th>
  ),
  TableCell: ({ children, className, style, colSpan }) => (
    <td className={className} style={style} colSpan={colSpan}>
      {children}
    </td>
  ),
  Button: ({ children }) => <button type="button">{children}</button>,
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuCheckboxItem: ({ children, checked }) => <div data-checked={checked}>{children}</div>,
};

const texts: DataTableTexts = {
  dragToGroup: "Drag a column here to group",
  groupedBy: "Grouped by",
  stopGrouping: (label) => `Stop grouping ${label}`,
  clear: "Clear",
  columnsCount: (v, t) => `Columns (${v}/${t})`,
  toggleColumns: "Toggle columns",
  noRecords: "No records",
  dragReorderOrGroup: "Drag to reorder or group",
  dragReorder: "Drag to reorder",
  columnGrouping: "Column grouping",
};

const icons: DataTableIcons = {
  IconSortAscending: () => <span>asc</span>,
  IconSortDescending: () => <span>desc</span>,
  IconArrowsSort: ({ className }) => <span className={className}>sort</span>,
  IconChevronRight: () => <span>{">"}</span>,
  IconChevronDown: () => <span>v</span>,
  IconColumns: ({ className }) => <span className={className}>cols</span>,
  IconX: ({ className }) => <span className={className}>x</span>,
};

type Row = { id: string; name: string; value: number };

const columns: DataTableColumn<Row>[] = [
  { key: "name", label: "Name", render: (r) => r.name, sortValue: (r) => r.name },
  {
    key: "value",
    label: "Value",
    render: (r) => r.value,
    sortValue: (r) => r.value,
    align: "right",
  },
];

describe("DataTable", () => {
  it("renders rows with slot components", () => {
    const rows: Row[] = [
      { id: "1", name: "Alpha", value: 10 },
      { id: "2", name: "Beta", value: 20 },
    ];
    const html = renderToStaticMarkup(
      <DataTable
        tableId="test"
        rows={rows}
        rowKey={(r) => r.id}
        columns={columns}
        slots={slots}
        texts={texts}
        icons={icons}
      />,
    );
    expect(html).toContain("Alpha");
    expect(html).toContain("Beta");
  });

  it("renders the empty message when no rows", () => {
    const html = renderToStaticMarkup(
      <DataTable
        tableId="empty"
        rows={[]}
        rowKey={(r) => (r as Row).id}
        columns={columns}
        slots={slots}
        texts={texts}
        icons={icons}
      />,
    );
    expect(html).toContain("No records");
  });

  it("renders a custom emptyMessage", () => {
    const html = renderToStaticMarkup(
      <DataTable
        tableId="custom-empty"
        rows={[]}
        rowKey={(r) => (r as Row).id}
        columns={columns}
        slots={slots}
        texts={texts}
        icons={icons}
        emptyMessage="Nothing here"
      />,
    );
    expect(html).toContain("Nothing here");
  });

  it("renders column headers from column labels", () => {
    const rows: Row[] = [{ id: "1", name: "A", value: 1 }];
    const html = renderToStaticMarkup(
      <DataTable
        tableId="headers"
        rows={rows}
        rowKey={(r) => r.id}
        columns={columns}
        slots={slots}
        texts={texts}
        icons={icons}
      />,
    );
    expect(html).toContain("Name");
    expect(html).toContain("Value");
  });

  it("renders group aggregates when groupAgg is provided", () => {
    const columnsWithAgg: DataTableColumn<Row>[] = [
      { key: "name", label: "Name", render: (r) => r.name, groupValue: (r) => r.name },
      {
        key: "value",
        label: "Value",
        render: (r) => r.value,
        sortValue: (r) => r.value,
        groupAgg: (rows) => `Sum: ${rows.reduce((s, r) => s + r.value, 0)}`,
      },
    ];
    const rows: Row[] = [
      { id: "1", name: "Group A", value: 10 },
      { id: "2", name: "Group A", value: 20 },
    ];
    const html = renderToStaticMarkup(
      <DataTable
        tableId="agg"
        rows={rows}
        rowKey={(r) => r.id}
        columns={columnsWithAgg}
        slots={slots}
        texts={texts}
        icons={icons}
        defaultGroupBy={["name"]}
      />,
    );
    expect(html).toContain("Sum: 30");
  });
});
