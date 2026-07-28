/**
 * Regression test for the hydration mismatch that shipped in this package.
 *
 * usePersistedState used to read localStorage inside the useState initializer. On the
 * server there is no localStorage, so it fell back to the default; on the client's
 * first render it returned the stored value. React then hydrated a tree that did not
 * match the server HTML.
 *
 * The invariant under test: the client's FIRST render must equal the server render,
 * and the stored preference must still be applied once effects have run.
 */
import { act, render, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DataTable,
  type DataTableColumn,
  type DataTableIcons,
  type DataTableSlots,
  type DataTableTexts,
} from "./data-table";

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

/** Text-free on purpose: these assertions read header text, so icons must not add any. */
const icons: DataTableIcons = {
  IconSortAscending: () => <span />,
  IconSortDescending: () => <span />,
  IconArrowsSort: ({ className }) => <span className={className} />,
  IconChevronRight: () => <span />,
  IconChevronDown: () => <span />,
  IconColumns: ({ className }) => <span className={className} />,
  IconX: ({ className }) => <span className={className} />,
};

type Row = { id: string; name: string; team: string };

const rows: Row[] = [
  { id: "1", name: "Ada", team: "Platform" },
  { id: "2", name: "Grace", team: "Platform" },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", label: "Name", render: (r) => r.name, sortValue: (r) => r.name },
  { key: "team", label: "Team", render: (r) => r.team, sortValue: (r) => r.team },
];

const TABLE_ID = "hydration-spec";
const ORDER_KEY = `dt:${TABLE_ID}:order`;

function table() {
  return (
    <DataTable
      tableId={TABLE_ID}
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      slots={slots}
      texts={texts}
      icons={icons}
    />
  );
}

/** Header labels in DOM order: what a stored column order actually changes. */
function headerOrder(html: string): string[] {
  return (
    [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
      // The capture group is optional in the regex match tuple's type, so default it.
      .map(([, inner = ""]) => inner.replace(/<[^>]+>/g, "").trim())
      .filter((label) => label === "Name" || label === "Team")
  );
}

afterEach(() => {
  localStorage.clear();
});

describe("DataTable persisted state and SSR", () => {
  it("hydrates server HTML without a mismatch when a column order is stored", async () => {
    // A stored preference that reverses the columns. Before the fix, the useState
    // initializer applied it on the client's first render while the server render
    // knew nothing about it, so React hydrated a tree that did not match.
    //
    // Testing Library's `render` cannot catch this: it wraps in act() and flushes
    // effects, so the DOM it exposes is already post-effect. The mismatch is only
    // observable by actually hydrating and watching what React reports.
    localStorage.setItem(ORDER_KEY, JSON.stringify(["team", "name"]));

    const serverHtml = renderToString(table());
    expect(headerOrder(serverHtml)).toEqual(["Name", "Team"]);

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    });

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, table());
    });

    spy.mockRestore();
    act(() => root?.unmount());
    container.remove();

    const hydrationErrors = errors.filter((message) =>
      /hydrat|did not match|server (?:HTML|rendered)/i.test(message),
    );
    expect(hydrationErrors, `React reported: ${hydrationErrors.join(" | ")}`).toEqual([]);
  });

  it("applies the stored column order once effects have run", async () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(["team", "name"]));

    const { container } = render(table());

    await waitFor(() => {
      expect(headerOrder(container.innerHTML)).toEqual(["Team", "Name"]);
    });
  });

  it("does not clobber the stored order with the default before reading it", async () => {
    const stored = JSON.stringify(["team", "name"]);
    localStorage.setItem(ORDER_KEY, stored);

    render(table());

    await waitFor(() => {
      expect(localStorage.getItem(ORDER_KEY)).toBe(stored);
    });
  });
});
